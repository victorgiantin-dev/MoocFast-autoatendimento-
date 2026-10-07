export type CategoryId = 'burgers' | 'smash' | 'combos' | 'sides' | 'drinks' | 'desserts';

export interface Category {
  id: CategoryId;
  name: string;
  icon: string;
  description: string;
}

export interface ExtraOption {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: CategoryId;
  image: string;
  stock: number; // Client MUST NEVER see this number!
  is_available: boolean;
  meatDonenessRequired?: boolean;
  removableIngredients?: string[];
  availableExtras?: ExtraOption[];
  badge?: string; // e.g. "Mais Pedido", "Chef Special", "Novidade"
}

export interface CartItem {
  cartId: string;
  product: MenuItem;
  quantity: number;
  selectedMeatPoint?: string;
  removedIngredients: string[];
  selectedExtras: ExtraOption[];
  notes?: string;
  totalItemPrice: number;
}

export type PaymentMethod = 'pix' | 'credit' | 'debit' | 'counter';
export type PaymentStatus = 'pending' | 'paid' | 'cancelled';
export type OrderStatus = 'received' | 'preparing' | 'ready' | 'delivered';

export interface Order {
  id: string;
  orderNumber: string;
  tableNumber: string;
  items: CartItem[];
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  customerName?: string;
  notes?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastSync?: string;
}
