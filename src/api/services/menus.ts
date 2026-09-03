import client from '../client';
import { ENDPOINTS } from '../endpoints';
import type { LinkTarget } from '@/features/seller/store/Dashboard/OnlineStore/builder/LinkTargetFields';

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export interface MenuItemChild extends LinkTarget {
  id: string;
  label: string;
  highlight?: boolean;
}

export interface MenuItem extends LinkTarget {
  id: string;
  label: string;
  highlight?: boolean;
  children?: MenuItemChild[];
}

export interface Menu {
  _id: string;
  storeId: string;
  name: string;
  items: MenuItem[];
  createdAt: string;
  updatedAt: string;
}

export function apiListMenus(storeId: string) {
  return client.get<never, ApiResponse<Menu[]>>(ENDPOINTS.MENUS.LIST(storeId));
}

export function apiCreateMenu(storeId: string, payload: { name: string; items?: MenuItem[] }) {
  return client.post<never, ApiResponse<Menu>>(ENDPOINTS.MENUS.LIST(storeId), payload);
}

export function apiUpdateMenu(storeId: string, menuId: string, payload: { name?: string; items?: MenuItem[] }) {
  return client.patch<never, ApiResponse<Menu>>(ENDPOINTS.MENUS.ITEM(storeId, menuId), payload);
}

export function apiDeleteMenu(storeId: string, menuId: string) {
  return client.delete<never, ApiResponse<null>>(ENDPOINTS.MENUS.ITEM(storeId, menuId));
}
