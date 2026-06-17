import {
  Coffee, ShoppingBag, Image as ImageIcon, Flame, Leaf, Droplets,
  Pencil, Camera, Sparkles, BookOpen, Droplet, Key, Utensils, Ruler,
} from 'lucide-react';
import type { PosProduct, PosCustomer } from './pos.types';

export const POS_PRODUCTS: PosProduct[] = [
  { name: 'Ceramic Mug',        price: 28, icon: Coffee,      sku: 'MUG-001', category: 'Ceramics',    stock: 34 },
  { name: 'Linen Tote',         price: 42, icon: ShoppingBag, sku: 'TOT-002', category: 'Accessories', stock: 18 },
  { name: 'Wall Print A3',      price: 18, icon: ImageIcon,   sku: 'PRT-003', category: 'Prints',      stock: 52 },
  { name: 'Scented Candle',     price: 24, icon: Flame,       sku: 'CND-004', category: 'Candles',     stock: 0  },
  { name: 'Cork Coasters 4pk',  price: 16, icon: Leaf,        sku: 'CST-005', category: 'Accessories', stock: 29 },
  { name: 'Hand Lotion 100ml',  price: 14, icon: Droplets,    sku: 'LOT-006', category: 'Accessories', stock: 45 },
  { name: 'Bamboo Pen Set',     price: 22, icon: Pencil,      sku: 'PEN-007', category: 'Accessories', stock: 12 },
  { name: 'Photo Book S',       price: 36, icon: Camera,      sku: 'PHO-008', category: 'Prints',      stock: 8  },
  { name: 'Silk Scrunchie 3pk', price: 12, icon: Sparkles,    sku: 'SCR-009', category: 'Accessories', stock: 67 },
  { name: 'Travel Journal',     price: 20, icon: BookOpen,    sku: 'JRN-010', category: 'Stationery',  stock: 23 },
  { name: 'Essential Oil 30ml', price: 19, icon: Droplet,     sku: 'OIL-011', category: 'Candles',     stock: 31 },
  { name: 'Macrame Keyring',    price: 10, icon: Key,         sku: 'KEY-012', category: 'Accessories', stock: 44 },
  { name: 'Ceramic Bowl Set',   price: 55, icon: Utensils,    sku: 'BWL-013', category: 'Ceramics',    stock: 7  },
  { name: 'Beeswax Candle',     price: 18, icon: Flame,       sku: 'BCN-014', category: 'Candles',     stock: 19 },
  { name: 'Washi Tape Set',     price: 9,  icon: Ruler,       sku: 'WSH-015', category: 'Stationery',  stock: 88 },
  { name: 'Linen Napkins 4pk',  price: 32, icon: Utensils,    sku: 'NAP-016', category: 'Accessories', stock: 14 },
];

export const HELD_SALES = [
  { id: 'H-001', customer: 'Walk-in',  items: 3, total: 74.00,  time: '2:14 PM' },
  { id: 'H-002', customer: 'Sarah M.', items: 1, total: 42.00,  time: '2:31 PM' },
];

export const RECENT_SALES = [
  { id: 'POS-8841', customer: 'David R.', items: 2, total: 52.00,  method: 'Card', time: '3:05 PM' },
  { id: 'POS-8840', customer: 'Walk-in',  items: 4, total: 86.00,  method: 'Cash', time: '2:48 PM' },
  { id: 'POS-8839', customer: 'Lena K.',  items: 1, total: 24.00,  method: 'Tap',  time: '2:31 PM' },
  { id: 'POS-8838', customer: 'Walk-in',  items: 3, total: 61.50,  method: 'Card', time: '1:59 PM' },
  { id: 'POS-8837', customer: 'Tom B.',   items: 6, total: 118.00, method: 'Cash', time: '1:22 PM' },
];

export const POS_CUSTOMERS: PosCustomer[] = [
  { name: 'Sarah Mitchell', email: 'sarah@email.com', points: 420, segment: 'VIP'   },
  { name: 'David Reynolds', email: 'david@email.com', points: 180, segment: 'Loyal' },
  { name: 'Lena Kowalski',  email: 'lena@email.com',  points: 60,  segment: 'New'   },
];
