import { mockUsers } from './mockData';
import { userService } from '../services/api';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

// Типы пользователей
export type UserRole = 'admin' | 'moderator' | 'worker' | 'pier' | 'bunker';

// Интерфейс пользователя
export interface User {
  id: string;
  name: string;
  role: UserRole;
  username: string;
  password?: string;
}

// Права доступа по ролям
export const rolePermissions = {
  admin: {
    canEdit: true,
    canDelete: true,
    canFreeze: true,
    canAddUsers: true,
    canViewReports: true,
    canExport: true,
    canManageOrders: true,
    canManageShifts: true,
  },
  moderator: {
    canEdit: true,
    canDelete: false,
    canFreeze: true,
    canAddUsers: false,
    canViewReports: true, 
    canExport: true,
    canManageOrders: true,
    canManageShifts: true,
  },
  worker: {
    canEdit: false,
    canDelete: false,
    canFreeze: false,
    canAddUsers: false,
    canViewReports: false,
    canExport: false,
    canManageOrders: false,
    canManageShifts: false,
  },
  pier: {
    canEdit: true,
    canDelete: false,
    canFreeze: false,
    canAddUsers: false,
    canViewReports: true,
    canExport: true,
    canManageOrders: false,
    canManageShifts: false,
  },
  bunker: {
    canEdit: true,
    canDelete: false,
    canFreeze: false,
    canAddUsers: false,
    canViewReports: true,
    canExport: true,
    canManageOrders: false,
    canManageShifts: false,
  }
};

// Авторизация пользователя
export const loginUser = async (username: string, password: string): Promise<User | null> => {
  try {
    const apiBaseUrl =
      typeof window !== 'undefined' && (window as any).API_BASE_URL
        ? (window as any).API_BASE_URL
        : 'http://91.237.249.96:5000/api';

    const storedDeviceMac = localStorage.getItem('deviceMac');
    const configuredDeviceMac =
      typeof window !== 'undefined' && (window as any).DEVICE_MAC
        ? String((window as any).DEVICE_MAC)
        : '';
    const deviceMac = (storedDeviceMac || configuredDeviceMac || '').trim() || undefined;

    let data: any = {};
    if (Capacitor.isNativePlatform()) {
      // Нативный HTTP обходит ограничения WebView (CORS/cleartext/mixed content).
      const nativeResponse = await CapacitorHttp.post({
        url: `${apiBaseUrl}/users/login`,
        headers: { 'Content-Type': 'application/json' },
        data: { username, password, deviceMac },
      });
      data =
        typeof nativeResponse.data === 'string'
          ? JSON.parse(nativeResponse.data || '{}')
          : (nativeResponse.data || {});
      if (nativeResponse.status < 200 || nativeResponse.status >= 300) {
        const message = data?.error || `HTTP ${nativeResponse.status}`;
        throw new Error(message);
      }
    } else {
      const loginResponse = await fetch(`${apiBaseUrl}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, deviceMac }),
        credentials: 'omit',
        mode: 'cors'
      });
      data = await loginResponse.json().catch(() => ({}));
      if (!loginResponse.ok) {
        const message = data?.error || `HTTP ${loginResponse.status}`;
        throw new Error(message);
      }
    }

    if (data && data.token) {
      localStorage.setItem('token', data.token);

      const user = data.user || {
        id: data.id,
        username: data.username,
        role: data.role,
        name: data.name
      };

      localStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    }
    return null;
  } catch (error) {
    console.error('Error logging in (fetch):', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Ошибка сети при обращении к серверу';
    throw new Error(message);
  }
};

// Получение текущего пользователя
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const token = localStorage.getItem('token');
    const currentUser = localStorage.getItem('currentUser');
    
    // Только если есть И токен И данные пользователя - возвращаем пользователя
    if (token && currentUser) {
      return JSON.parse(currentUser);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Выход пользователя
export const logoutUser = async (): Promise<void> => {
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
};

// Проверка прав доступа
export const checkPermission = async (permission: keyof typeof rolePermissions.admin): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;
  
  return rolePermissions[user.role][permission] || false;
};

// Определение типов транзакций, доступных для роли
export const getVisibleTransactionTypes = (role: UserRole): string[] => {
  switch (role) {
    case 'admin':
    case 'moderator':
      return ['purchase', 'sale', 'bunker_sale', 'base_to_bunker', 'bunker_to_base'];
    case 'pier':
      return ['bunker_sale', 'purchase']; // Причал видит продажи с причала и приобретения
    case 'bunker':
      return ['sale', 'base_to_bunker', 'bunker_to_base']; // Бункеровщик видит продажи с катера и все операции с бункером
    case 'worker':
    default:
      return ['sale', 'bunker_sale']; // Рабочий видит обе продажи
  }
};

// Проверка, может ли пользователь видеть транзакцию
export const canViewTransaction = (transactionType: string, userRole: UserRole): boolean => {
  const visibleTypes = getVisibleTransactionTypes(userRole);
  return visibleTypes.includes(transactionType);
}; 