import axios from 'axios';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

// Автоматическое определение API URL в зависимости от платформы
const getApiUrl = () => {
  // Для Android APK и прод-сценария фиксируем прямой адрес API,
  // чтобы исключить ошибки автодетекта hostname/port.
  return 'http://91.237.249.96:5000/api';
};

const API_URL = getApiUrl();
console.log('🔗 API Base URL:', API_URL);

// Создаем инстанс axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Увеличиваем таймаут для запросов
  timeout: 15000
});

// Перехватчик для добавления токена авторизации
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Перехватчик для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Ошибка от сервера
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Ошибка сети
      console.error('Network Error:', error.request);
    } else {
      // Ошибка в настройках запроса
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

const isNative = () => Capacitor.isNativePlatform();

const buildHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const toQueryString = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      search.append(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

const request = async (method, path, { data, params } = {}) => {
  if (isNative()) {
    const url = `${API_URL}${path}${toQueryString(params)}`;
    const nativeRes = await CapacitorHttp.request({
      method: method.toUpperCase(),
      url,
      headers: buildHeaders(),
      data
    });
    return { data: nativeRes.data, status: nativeRes.status };
  }

  return api.request({
    method,
    url: path,
    data,
    params
  });
};

// Транзакции топлива
export const fuelService = {
  getTransactions: () => request('get', '/fuel'),
  getTransaction: (id) => request('get', `/fuel/${id}`),
  createTransaction: (data) => request('post', '/fuel', { data }),
  updateTransaction: (id, data) => request('put', `/fuel/${id}`, { data }),
  deleteTransaction: (id) => request('delete', `/fuel/transaction/${id}`),
  getAllTransactions: () => request('get', '/fuel/all'),
};

// Смены
export const shiftService = {
  getShifts: (params) => request('get', '/shifts', { params }).then(res => res.data),
  getShift: (id) => request('get', `/shifts/${id}`).then(res => res.data),
  createShift: (data) => request('post', '/shifts', { data }).then(res => res.data),
  updateShift: (id, data) => request('put', `/shifts/${id}`, { data }).then(res => res.data),
  deleteShift: (id) => request('delete', `/shifts/${id}`).then(res => res.data)
};

// Пользователи
export const userService = {
  getUsers: () => request('get', '/users'),
  getUser: (id) => request('get', `/users/${id}`),
  createUser: (data) => request('post', '/users', { data }),
  updateUser: (id, data) => request('put', `/users/${id}`, { data }),
  deleteUser: (id) => request('delete', `/users/${id}`),
  login: (username, password) => request('post', '/users/login', { data: { username, password } }),
  getCurrentUser: () => request('get', '/users/me')
};

const unwrapData = async (promise) => {
  const res = await promise;
  return res && res.data !== undefined ? res.data : res;
};

export const deviceService = {
  getDevices: () => unwrapData(request('get', '/devices')),
  createDevice: (data) => unwrapData(request('post', '/devices', { data })),
  updateDevice: (id, data) => unwrapData(request('put', `/devices/${id}`, { data })),
  deleteDevice: (id) => unwrapData(request('delete', `/devices/${id}`))
};

// Заказы
export const orderService = {
  getOrders: () => request('get', '/orders'),
  getOrder: (id) => request('get', `/orders/${id}`),
  createOrder: (data) => request('post', '/orders', { data }),
  updateOrder: (id, data) => request('put', `/orders/${id}`, { data }),
  deleteOrder: (id) => request('delete', `/orders/${id}`)
};

export default api; 