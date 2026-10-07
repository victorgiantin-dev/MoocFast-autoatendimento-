import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MenuItem, Order, OrderStatus } from '../types';
import { INITIAL_MENU_ITEMS } from '../data/initialMenu';

const CONFIG_STORAGE_KEY = 'moocfast_supabase_config';
const LOCAL_MENU_STORAGE_KEY = 'moocfast_local_menu_v1';
const LOCAL_ORDERS_STORAGE_KEY = 'moocfast_local_orders_v1';

export interface StoredSupabaseConfig {
  url: string;
  anonKey: string;
}

export function isMissingTableError(error: any): boolean {
  if (!error) return false;
  const code = String(error.code || '');
  const message = String(error.message || '');
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    message.includes('Could not find the table') ||
    (message.includes('relation') && message.includes('does not exist'))
  );
}

let cachedClient: SupabaseClient | null = null;
let lastClientKey: string = '';

export function getStoredSupabaseConfig(): StoredSupabaseConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Erro ao ler config do Supabase do localStorage', err);
  }

  // Fallback to Vite env if provided
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  return {
    url: envUrl,
    anonKey: envKey,
  };
}

export function saveStoredSupabaseConfig(config: StoredSupabaseConfig): void {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  cachedClient = null; // Reset cached client
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  const keyCombination = `${config.url}___${config.anonKey}`;
  if (cachedClient && lastClientKey === keyCombination) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
      },
    });
    lastClientKey = keyCombination;
    return cachedClient;
  } catch (err) {
    console.error('Falha ao inicializar cliente Supabase:', err);
    return null;
  }
}

export async function testSupabaseConnection(url?: string, anonKey?: string): Promise<{
  success: boolean;
  message: string;
  missingTables?: string[];
}> {
  const targetUrl = url || getStoredSupabaseConfig().url;
  const targetKey = anonKey || getStoredSupabaseConfig().anonKey;

  if (!targetUrl || !targetKey) {
    return {
      success: false,
      message: 'URL do projeto e chave Anon Key não foram informadas.',
    };
  }

  try {
    const client = createClient(targetUrl, targetKey);
    const missing: string[] = [];

    // Test mooc_menu_items
    const { error: menuError } = await client.from('mooc_menu_items').select('id').limit(1);
    if (menuError && isMissingTableError(menuError)) {
      missing.push('mooc_menu_items');
    } else if (menuError) {
      return {
        success: false,
        message: `Erro ao autenticar no Supabase: ${menuError.message} (${menuError.code || ''})`,
      };
    }

    // Test mooc_orders
    const { error: ordersError } = await client.from('mooc_orders').select('id').limit(1);
    if (ordersError && isMissingTableError(ordersError)) {
      missing.push('mooc_orders');
    } else if (ordersError) {
      return {
        success: false,
        message: `Erro na tabela de pedidos: ${ordersError.message} (${ordersError.code || ''})`,
      };
    }

    if (missing.length > 0) {
      return {
        success: true,
        missingTables: missing,
        message: `Conectado ao Supabase com sucesso! Porém a(s) tabela(s) [${missing.join(', ')}] ainda não foram criadas. Copie o script SQL abaixo e execute no SQL Editor do Supabase para ativar a sincronização em nuvem.`,
      };
    }

    return {
      success: true,
      message: 'Conexão com Supabase ativa e tabelas mooc_menu_items e mooc_orders prontas para uso!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Falha na requisição: ${err?.message || 'Verifique sua URL e conexão com a internet.'}`,
    };
  }
}

// Local storage management for menu items
export function getLocalMenuItems(): MenuItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_MENU_STORAGE_KEY);
    if (raw) {
      const items = JSON.parse(raw);
      if (Array.isArray(items) && items.length > 0) {
        return items;
      }
    }
  } catch (e) {
    console.error('Erro ao ler cardápio local', e);
  }

  // Seed default
  localStorage.setItem(LOCAL_MENU_STORAGE_KEY, JSON.stringify(INITIAL_MENU_ITEMS));
  return INITIAL_MENU_ITEMS;
}

export function saveLocalMenuItems(items: MenuItem[]): void {
  localStorage.setItem(LOCAL_MENU_STORAGE_KEY, JSON.stringify(items));
}

// Database sync and fetch operations
export async function loadMenuItems(): Promise<{ items: MenuItem[]; source: 'supabase' | 'local' }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('mooc_menu_items')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        if (isMissingTableError(error)) {
          localStorage.setItem('moocfast_missing_menu_table_detected', 'true');
        }
        return { items: getLocalMenuItems(), source: 'local' };
      }

      if (data && data.length > 0) {
        localStorage.removeItem('moocfast_missing_menu_table_detected');
        const mappedItems: MenuItem[] = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          description: d.description || '',
          price: Number(d.price),
          category: d.category,
          image: d.image || '',
          stock: Number(d.stock ?? 0),
          is_available: Boolean(d.is_available),
          badge: d.badge || undefined,
          meatDonenessRequired: Boolean(d.meat_doneness_required),
          removableIngredients: d.removable_ingredients || [],
          availableExtras: d.available_extras || [],
        }));

        saveLocalMenuItems(mappedItems);
        return { items: mappedItems, source: 'supabase' };
      }
    } catch (err) {
      console.warn('Tentativa de carregar itens do Supabase falhou, usando cache local:', err);
    }
  }

  return { items: getLocalMenuItems(), source: 'local' };
}

export async function persistStockUpdate(productId: string, newStock: number, isAvailable: boolean): Promise<boolean> {
  // Update local store first
  const current = getLocalMenuItems();
  const updated = current.map(item => {
    if (item.id === productId) {
      return {
        ...item,
        stock: newStock,
        is_available: isAvailable,
      };
    }
    return item;
  });
  saveLocalMenuItems(updated);

  // If Supabase is connected, update remotely
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client
        .from('mooc_menu_items')
        .update({
          stock: newStock,
          is_available: isAvailable,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (error) {
        if (isMissingTableError(error)) {
          localStorage.setItem('moocfast_missing_menu_table_detected', 'true');
        }
        return false;
      }
    } catch (err) {
      return false;
    }
  }

  return true;
}

export async function persistMenuItemEdit(item: MenuItem): Promise<boolean> {
  const current = getLocalMenuItems();
  const existingIndex = current.findIndex(i => i.id === item.id);
  let updated: MenuItem[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = item;
  } else {
    updated = [...current, item];
  }
  saveLocalMenuItems(updated);

  const client = getSupabaseClient();
  if (client) {
    try {
      const payload = {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image,
        stock: item.stock,
        is_available: item.is_available,
        badge: item.badge || null,
        meat_doneness_required: !!item.meatDonenessRequired,
        removable_ingredients: item.removableIngredients || [],
        available_extras: item.availableExtras || [],
        updated_at: new Date().toISOString(),
      };

      const { error } = await client.from('mooc_menu_items').upsert(payload);
      if (error) {
        if (isMissingTableError(error)) {
          localStorage.setItem('moocfast_missing_menu_table_detected', 'true');
        }
        return false;
      }
    } catch (err) {
      return false;
    }
  }

  return true;
}

// Orders management
export function getLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao ler pedidos locais', err);
  }
  return [];
}

export function saveLocalOrders(orders: Order[]): void {
  localStorage.setItem(LOCAL_ORDERS_STORAGE_KEY, JSON.stringify(orders));
}

export async function loadOrders(): Promise<{ orders: Order[]; source: 'supabase' | 'local' }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('mooc_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (isMissingTableError(error)) {
          localStorage.setItem('moocfast_missing_orders_table_detected', 'true');
        }
        return { orders: getLocalOrders(), source: 'local' };
      }

      if (data) {
        localStorage.removeItem('moocfast_missing_orders_table_detected');
        const mapped: Order[] = data.map((d: any) => ({
          id: d.id,
          orderNumber: d.order_number,
          tableNumber: d.table_number,
          items: d.items || [],
          total: Number(d.total),
          paymentMethod: d.payment_method,
          paymentStatus: d.payment_status,
          orderStatus: d.order_status,
          createdAt: d.created_at,
          customerName: d.customer_name || undefined,
          notes: d.notes || undefined,
        }));
        saveLocalOrders(mapped);
        return { orders: mapped, source: 'supabase' };
      }
    } catch (err) {
      console.warn('Erro ao carregar pedidos do Supabase:', err);
    }
  }

  return { orders: getLocalOrders(), source: 'local' };
}

export async function submitOrder(order: Order): Promise<{ success: boolean; error?: string; savedLocallyOnly?: boolean }> {
  // 1. Add order to local list immediately
  const currentOrders = getLocalOrders();
  const updatedOrders = [order, ...currentOrders];
  saveLocalOrders(updatedOrders);

  // 2. Decrement stock locally for ordered items
  const menuItems = getLocalMenuItems();
  const updatedMenu = menuItems.map(item => {
    const orderedQuantity = order.items
      .filter(ci => ci.product.id === item.id)
      .reduce((sum, ci) => sum + ci.quantity, 0);

    if (orderedQuantity > 0) {
      const newStock = Math.max(0, item.stock - orderedQuantity);
      return {
        ...item,
        stock: newStock,
        is_available: newStock > 0 && item.is_available,
      };
    }
    return item;
  });
  saveLocalMenuItems(updatedMenu);

  // 3. If Supabase is connected, write to Supabase
  const client = getSupabaseClient();
  if (client) {
    try {
      const orderPayload = {
        id: order.id,
        order_number: order.orderNumber,
        table_number: order.tableNumber,
        items: order.items,
        total: order.total,
        payment_method: order.paymentMethod,
        payment_status: order.paymentStatus,
        order_status: order.orderStatus,
        customer_name: order.customerName || null,
        notes: order.notes || null,
        created_at: order.createdAt,
      };

      const { error: orderError } = await client.from('mooc_orders').insert(orderPayload);
      if (orderError) {
        if (isMissingTableError(orderError)) {
          // Table doesn't exist yet on remote Supabase. Keep order safe locally and notify Admin
          localStorage.setItem('moocfast_missing_orders_table_detected', 'true');
          console.warn(
            'Aviso MoocFast: Tabela mooc_orders ainda não criada no Supabase (PGRST205). Pedido registrado com sucesso localmente no tablet.'
          );
          return { success: true, savedLocallyOnly: true };
        }
        console.warn('Supabase retornou aviso ao inserir pedido, mantido localmente:', orderError.message);
        return { success: true, savedLocallyOnly: true };
      }

      // Also update stock in Supabase for each ordered item
      for (const item of updatedMenu) {
        const wasOrdered = order.items.some(ci => ci.product.id === item.id);
        if (wasOrdered) {
          const { error: stockErr } = await client
            .from('mooc_menu_items')
            .update({
              stock: item.stock,
              is_available: item.is_available,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.id);

          if (stockErr && isMissingTableError(stockErr)) {
            localStorage.setItem('moocfast_missing_menu_table_detected', 'true');
          }
        }
      }
    } catch (err: any) {
      console.warn('Tentativa de comunicação com Supabase no checkout mantida localmente:', err);
      return { success: true, savedLocallyOnly: true };
    }
  }

  return { success: true };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
  const currentOrders = getLocalOrders();
  const updatedOrders = currentOrders.map(o => o.id === orderId ? { ...o, orderStatus: status } : o);
  saveLocalOrders(updatedOrders);

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client
        .from('mooc_orders')
        .update({ order_status: status })
        .eq('id', orderId);

      if (error) {
        if (isMissingTableError(error)) {
          localStorage.setItem('moocfast_missing_orders_table_detected', 'true');
        }
        return false;
      }
    } catch (err) {
      return false;
    }
  }

  return true;
}

export async function uploadInitialMenuToSupabase(): Promise<{ success: boolean; count: number; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, count: 0, message: 'Supabase não está configurado.' };
  }

  const items = getLocalMenuItems();
  const payloads = items.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    image: item.image,
    stock: item.stock,
    is_available: item.is_available,
    badge: item.badge || null,
    meat_doneness_required: !!item.meatDonenessRequired,
    removable_ingredients: item.removableIngredients || [],
    available_extras: item.availableExtras || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  try {
    const { error } = await client.from('mooc_menu_items').upsert(payloads);
    if (error) {
      if (isMissingTableError(error)) {
        return {
          success: false,
          count: 0,
          message: 'A tabela mooc_menu_items ainda não foi criada no seu Supabase. Copie o Script SQL abaixo e execute no SQL Editor primeiro.',
        };
      }
      return { success: false, count: 0, message: `Erro ao fazer upload: ${error.message}` };
    }
    return { success: true, count: payloads.length, message: `${payloads.length} itens do cardápio MoocFast sincronizados com o Supabase!` };
  } catch (err: any) {
    return { success: false, count: 0, message: `Erro: ${err?.message || 'Falha ao sincronizar'}` };
  }
}

export const SUPABASE_SQL_SETUP_SCRIPT = `-- =======================================================
-- SCHEMA SQL COMPLETO PARA O MOOCFAST NO SUPABASE
-- Inclui tabelas do banco, políticas RLS e Storage de imagens
-- Copie e cole este script no Supabase SQL Editor e clique em RUN
-- =======================================================

-- 1. CRIAÇÃO DA TABELA DE ITENS DO CARDÁPIO COM ESTOQUE
CREATE TABLE IF NOT EXISTS public.mooc_menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    category TEXT NOT NULL,
    image TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    is_available BOOLEAN NOT NULL DEFAULT true,
    badge TEXT,
    meat_doneness_required BOOLEAN DEFAULT false,
    removable_ingredients JSONB DEFAULT '[]'::jsonb,
    available_extras JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. CRIAÇÃO DA TABELA DE PEDIDOS
CREATE TABLE IF NOT EXISTS public.mooc_orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL,
    table_number TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total NUMERIC(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL,
    order_status TEXT NOT NULL,
    customer_name TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. HABILITAR ROW LEVEL SECURITY (RLS) NAS TABELAS
ALTER TABLE public.mooc_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mooc_orders ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE ACESSO PARA TABELA DO CARDÁPIO (mooc_menu_items)
DROP POLICY IF EXISTS "Permitir leitura pública do cardápio" ON public.mooc_menu_items;
CREATE POLICY "Permitir leitura pública do cardápio" 
ON public.mooc_menu_items FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Permitir inserção e atualização de cardápio" ON public.mooc_menu_items;
CREATE POLICY "Permitir inserção e atualização de cardápio" 
ON public.mooc_menu_items FOR ALL 
USING (true) 
WITH CHECK (true);

-- 5. POLÍTICAS DE ACESSO PARA TABELA DE PEDIDOS (mooc_orders)
DROP POLICY IF EXISTS "Permitir leitura dos pedidos" ON public.mooc_orders;
CREATE POLICY "Permitir leitura dos pedidos" 
ON public.mooc_orders FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Permitir inserção e atualização de pedidos" ON public.mooc_orders;
CREATE POLICY "Permitir inserção e atualização de pedidos" 
ON public.mooc_orders FOR ALL 
USING (true) 
WITH CHECK (true);

-- =======================================================
-- 6. CONFIGURAÇÃO DE ARMAZENAMENTO DE ARQUIVOS (SUPABASE STORAGE)
-- Bucket público para fotos de hambúrgueres e produtos
-- =======================================================

-- Criação do Bucket de Armazenamento
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'mooc-products',
    'mooc-products',
    true,
    5242880, -- Limite de 5MB por foto
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

-- 7. POLÍTICAS DE ARMAZENAMENTO (STORAGE.OBJECTS)
-- Leitura pública de fotos dos lanches
DROP POLICY IF EXISTS "Leitura pública de fotos do cardápio" ON storage.objects;
CREATE POLICY "Leitura pública de fotos do cardápio"
ON storage.objects FOR SELECT
USING (bucket_id = 'mooc-products');

-- Upload de imagens de novos lanches e acompanhamentos
DROP POLICY IF EXISTS "Permitir upload de fotos de produtos" ON storage.objects;
CREATE POLICY "Permitir upload de fotos de produtos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'mooc-products');

-- Atualização de fotos existentes
DROP POLICY IF EXISTS "Permitir atualização de fotos de produtos" ON storage.objects;
CREATE POLICY "Permitir atualização de fotos de produtos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'mooc-products')
WITH CHECK (bucket_id = 'mooc-products');

-- Exclusão de fotos de produtos
DROP POLICY IF EXISTS "Permitir exclusão de fotos de produtos" ON storage.objects;
CREATE POLICY "Permitir exclusão de fotos de produtos"
ON storage.objects FOR DELETE
USING (bucket_id = 'mooc-products');
`;

