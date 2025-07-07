import axios from 'axios';
import { ManagedApiProvider } from '../types';

const API_BASE = "https://key-manager-backend.onrender.com/api";

export const fetchKeys = async () => {
  const response = await axios.get(`${API_BASE}/keys`);
  return response.data;
};

export const createKey = async (payload: any) => {
  try {
    console.log('Creating key with payload:', payload);
    const response = await axios.post(`${API_BASE}/keys`, payload);
    console.log('Create key response:', response.data);
    addAuditLog(`Tạo key mới: ${payload.key || ''}`);
    return response.data;
  } catch (error: any) {
    console.error('Create key error:', error);
    if (error.response) {
      // Server responded with error status
      const errorMsg = error.response.data?.message || error.response.data || `Server error: ${error.response.status}`;
      throw new Error(errorMsg);
    } else if (error.request) {
      // Network error
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
    } else {
      // Other error
      throw new Error(error.message || 'Lỗi không xác định');
    }
  }
};

export const revokeKey = async (key: string) => {
  const response = await axios.post(`${API_BASE}/keys/revoke`, { key });
  addAuditLog(`Thu hồi key: ${key}`);
  return response.data;
};

export const updateCredit = async (key: string, amount: number) => {
  const response = await axios.post(`${API_BASE}/keys/update-credit`, { key, amount });
  addAuditLog(`Cập nhật credit cho key: ${key} (${amount > 0 ? '+' : ''}${amount})`);
  return response.data;
};

// Audit log (local, có thể thay bằng API nếu backend hỗ trợ)
const AUDIT_LOG_KEY = 'admin_audit_log';

export function addAuditLog(msg: string) {
  const logs = getAuditLog();
  logs.unshift({ msg, time: new Date().toLocaleString() });
  localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));
}

export function getAuditLog() {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

// API Provider Management
const API_PROVIDERS_STORAGE_KEY = 'admin_api_providers';

export const getApiProviders = (): ManagedApiProvider[] => {
  try {
    const stored = localStorage.getItem(API_PROVIDERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading API providers:', error);
    return [];
  }
};

export const saveApiProviders = (providers: ManagedApiProvider[]): void => {
  try {
    localStorage.setItem(API_PROVIDERS_STORAGE_KEY, JSON.stringify(providers));
    addAuditLog(`Cập nhật cấu hình API providers (${providers.length} providers)`);
  } catch (error) {
    console.error('Error saving API providers:', error);
    throw error;
  }
};

export const getDefaultApiProvider = (providerType?: string): ManagedApiProvider | null => {
  const providers = getApiProviders();
  
  if (providerType) {
    // Tìm provider cụ thể
    return providers.find(p => p.provider.toLowerCase() === providerType.toLowerCase() && p.status === 'Active') || null;
  }
  
  // Tìm provider mặc định
  return providers.find(p => p.isDefault && p.status === 'Active') || null;
};

export const updateProviderUsage = (providerId: string, requestCount: number, cost: number): void => {
  const providers = getApiProviders();
  const updatedProviders = providers.map(p => {
    if (p.id === providerId) {
      return {
        ...p,
        dailyUsage: p.dailyUsage + requestCount,
        monthlyUsage: p.monthlyUsage + requestCount,
        costToday: p.costToday + cost,
        lastChecked: new Date().toISOString()
      };
    }
    return p;
  });
  
  saveApiProviders(updatedProviders);
}; 