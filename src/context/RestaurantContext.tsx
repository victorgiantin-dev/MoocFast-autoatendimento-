import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { MenuItem, Category, CategoryId, CartItem, Order, OrderStatus, PaymentMethod } from '../types';
import { CATEGORIES } from '../data/initialMenu';
import {
  loadMenuItems,
  persistStockUpdate,
  persistMenuItemEdit,
  loadOrders,
  submitOrder,
  updateOrderStatus,
} from '../services/supabase';

interface RestaurantContextType {
  // Menu & Categories
  menuItems: MenuItem[];
  categories: Category[];
  selectedCategory: CategoryId;
  setSelectedCategory: (cat: CategoryId) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoadingMenu: boolean;
  refreshMenu: () => Promise<void>;

  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (cartId: string) => void;
  updateCartQuantity: (cartId: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // Table
  tableNumber: string;
  setTableNumber: (table: string) => void;

  // Orders
  orders: Order[];
  isLoadingOrders: boolean;
  refreshOrders: () => Promise<void>;
  createNewOrder: (paymentMethod: PaymentMethod, customerName?: string, notes?: string) => Promise<Order>;
  updateOrderState: (orderId: string, status: OrderStatus) => Promise<void>;
  lastSubmittedOrder: Order | null;
  setLastSubmittedOrder: (order: Order | null) => void;
  tableOrders: Order[]; // Orders made by this table

  // Admin Management
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  isAdminAuthenticated: boolean;
  loginAdmin: (pin: string) => boolean;
  logoutAdmin: () => void;
  updateProductStock: (id: string, newStock: number, isAvailable: boolean) => Promise<void>;
  saveProduct: (product: MenuItem) => Promise<void>;

  // Waiter Assistance
  waiterCallReason: string | null;
  callWaiter: (reason: string) => void;
  dismissWaiterCall: () => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

const ADMIN_PIN = '1234';
const TABLE_KEY = 'moocfast_current_table';

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories] = useState<Category[]>(CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('burgers');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Table state (e.g., "Mesa 04")
  const [tableNumber, setTableNumberState] = useState<string>(() => {
    return localStorage.getItem(TABLE_KEY) || 'Mesa 04';
  });

  const setTableNumber = (table: string) => {
    localStorage.setItem(TABLE_KEY, table);
    setTableNumberState(table);
  };

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [lastSubmittedOrder, setLastSubmittedOrder] = useState<Order | null>(null);

  // Admin state
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Waiter assistance
  const [waiterCallReason, setWaiterCallReason] = useState<string | null>(null);

  // Load menu items
  const refreshMenu = useCallback(async () => {
    setIsLoadingMenu(true);
    try {
      const { items } = await loadMenuItems();
      setMenuItems(items);
    } catch (e) {
      console.error('Erro ao carregar cardápio', e);
    } finally {
      setIsLoadingMenu(false);
    }
  }, []);

  // Load orders
  const refreshOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const { orders: fetchedOrders } = await loadOrders();
      setOrders(fetchedOrders);
    } catch (e) {
      console.error('Erro ao carregar pedidos', e);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    refreshMenu();
    refreshOrders();

    // Auto refresh interval for real-time order updates (every 6 seconds)
    const interval = setInterval(() => {
      loadOrders().then(({ orders: o }) => setOrders(o));
      loadMenuItems().then(({ items: m }) => setMenuItems(m));
    }, 6000);

    return () => clearInterval(interval);
  }, [refreshMenu, refreshOrders]);

  // Cart Actions
  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      // Check if identical item already exists (same meat doneness, same removed ingredients, same extras)
      const existingIndex = prev.findIndex(ci => {
        if (ci.product.id !== item.product.id) return false;
        if (ci.selectedMeatPoint !== item.selectedMeatPoint) return false;
        if (JSON.stringify(ci.removedIngredients.sort()) !== JSON.stringify(item.removedIngredients.sort())) return false;
        if (JSON.stringify(ci.selectedExtras.map(e => e.id).sort()) !== JSON.stringify(item.selectedExtras.map(e => e.id).sort())) return false;
        return true;
      });

      if (existingIndex >= 0) {
        const next = [...prev];
        const current = next[existingIndex];
        const newQty = current.quantity + item.quantity;
        const unitPrice = current.totalItemPrice / current.quantity;
        next[existingIndex] = {
          ...current,
          quantity: newQty,
          totalItemPrice: unitPrice * newQty,
        };
        return next;
      }

      return [...prev, item];
    });
  }, []);

  const removeFromCart = useCallback((cartId: string) => {
    setCart(prev => prev.filter(i => i.cartId !== cartId));
  }, []);

  const updateCartQuantity = useCallback((cartId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.cartId === cartId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const unitPrice = item.totalItemPrice / item.quantity;
            return {
              ...item,
              quantity: newQty,
              totalItemPrice: unitPrice * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.totalItemPrice, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  // Orders by this table
  const tableOrders = useMemo(() => {
    return orders.filter(o => o.tableNumber.toLowerCase() === tableNumber.toLowerCase());
  }, [orders, tableNumber]);

  // Create Order
  const createNewOrder = async (
    paymentMethod: PaymentMethod,
    customerName?: string,
    notes?: string
  ): Promise<Order> => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const orderNumber = `MF-${randomSuffix}`;

    const newOrder: Order = {
      id: `ord_${Date.now()}_${randomSuffix}`,
      orderNumber,
      tableNumber,
      items: [...cart],
      total: cartTotal,
      paymentMethod,
      paymentStatus: paymentMethod === 'counter' ? 'pending' : 'paid',
      orderStatus: 'received',
      createdAt: new Date().toISOString(),
      customerName,
      notes,
    };

    await submitOrder(newOrder);

    // Refresh local lists
    await refreshMenu();
    await refreshOrders();

    setLastSubmittedOrder(newOrder);
    clearCart();
    setIsCartOpen(false);

    return newOrder;
  };

  const updateOrderState = async (orderId: string, status: OrderStatus) => {
    await updateOrderStatus(orderId, status);
    await refreshOrders();
  };

  // Admin authentication
  const loginAdmin = (pin: string): boolean => {
    if (pin === ADMIN_PIN || pin === 'admin') {
      setIsAdminAuthenticated(true);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    setIsAdminOpen(false);
  };

  // Stock and product updates
  const updateProductStock = async (id: string, newStock: number, isAvailable: boolean) => {
    await persistStockUpdate(id, newStock, isAvailable);
    await refreshMenu();
  };

  const saveProduct = async (product: MenuItem) => {
    await persistMenuItemEdit(product);
    await refreshMenu();
  };

  // Waiter Assistance
  const callWaiter = (reason: string) => {
    setWaiterCallReason(reason);
  };

  const dismissWaiterCall = () => {
    setWaiterCallReason(null);
  };

  return (
    <RestaurantContext.Provider
      value={{
        menuItems,
        categories,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        isLoadingMenu,
        refreshMenu,

        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        cartCount,
        isCartOpen,
        setIsCartOpen,

        tableNumber,
        setTableNumber,

        orders,
        isLoadingOrders,
        refreshOrders,
        createNewOrder,
        updateOrderState,
        lastSubmittedOrder,
        setLastSubmittedOrder,
        tableOrders,

        isAdminOpen,
        setIsAdminOpen,
        isAdminAuthenticated,
        loginAdmin,
        logoutAdmin,
        updateProductStock,
        saveProduct,

        waiterCallReason,
        callWaiter,
        dismissWaiterCall,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = (): RestaurantContextType => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant deve ser usado dentro de RestaurantProvider');
  }
  return context;
};
