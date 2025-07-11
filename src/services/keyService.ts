import axios from 'axios';
import { mockDataService, simulateNetworkDelay } from './mockDataService';

// --- Base API Configuration ---
const API_BASE = process.env.REACT_APP_API_URL || "/api";

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000, // 10 seconds - shorter timeout for faster fallback
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag Ä‘á»ƒ track backend status
let isBackendAvailable = true;

// Retry interceptor vá»›i fallback logic
apiClient.interceptors.response.use(
  (response) => {
    isBackendAvailable = true; // Backend hoáº¡t Ä‘á»™ng
    return response;
  },
  async (error) => {
    const { config } = error;
    
    // Náº¿u lÃ  lá»—i network hoáº·c timeout, mark backend unavailable
    if (error.code === 'ECONNABORTED' || 
        error.message.includes('timeout') ||
        error.message.includes('Network Error') ||
        error.message.includes('Receiving end does not exist')) {
      isBackendAvailable = false;
    }
    
    return Promise.reject(error);
  }
);

// --- Fallback Helper ---
const withFallback = async (apiCall: () => Promise<any>, mockData: any) => {
  try {
    if (!isBackendAvailable) {
      console.log('ðŸ”„ Backend unavailable, using mock data');
      await simulateNetworkDelay(800); // Simulate realistic delay
      return mockData;
    }
    
    const result = await apiCall();
    return result;
  } catch (error) {
    console.error('âŒ API call failed, falling back to mock data:', error);
    isBackendAvailable = false;
    await simulateNetworkDelay(500);
    return mockData;
  }
};

// --- API Service Functions vá»›i Fallback ---

/**
 * Láº¥y dá»¯ liá»‡u thá»‘ng kÃª tá»•ng quan cho trang Dashboard.
 */
export const fetchDashboardStats = async () => {
  return withFallback(
    () => apiClient.get('/stats/dashboard').then(res => res.data),
    mockDataService.dashboardStats
  );
};

/**
 * Láº¥y danh sÃ¡ch táº¥t cáº£ cÃ¡c key.
 */
export const fetchKeys = async () => {
  return withFallback(
    () => apiClient.get('/keys').then(res => res.data),
    mockDataService.keys
  );
};

/**
 * Láº¥y danh sÃ¡ch cÃ¡c nhÃ  cung cáº¥p API tá»« backend.
 */
export const fetchApiProviders = async () => {
  return withFallback(
    () => apiClient.get('/providers').then(res => res.data),
    mockDataService.apiProviders
  );
};

/**
 * Láº¥y danh sÃ¡ch cÃ¡c hoáº¡t Ä‘á»™ng gáº§n Ä‘Ã¢y (audit log).
 */
export const fetchAuditLogs = async () => {
  return withFallback(
    () => apiClient.get('/audit-log').then(res => res.data),
    mockDataService.auditLogs
  );
};

/**
 * Láº¥y danh sÃ¡ch táº¥t cáº£ cÃ¡c gÃ³i cÆ°á»›c.
 */
export const fetchPackages = async () => {
  return withFallback(
    () => apiClient.get('/packages').then(res => res.data),
    mockDataService.packages
  );
};

// --- Write Operations (Backend Only) ---

/**
 * Táº¡o má»™t key má»›i.
 */
export const createKey = async (payload: { key: string; expiredAt?: Date; maxActivations?: number; note?: string; credit?: number }) => {
  if (!isBackendAvailable) {
    throw new Error('Chá»©c nÄƒng táº¡o key cáº§n backend hoáº¡t Ä‘á»™ng. Vui lÃ²ng thá»­ láº¡i sau.');
  }
  
  try {
    const response = await apiClient.post('/keys', payload);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      const errorMsg = error.response.data?.message || `Lá»—i mÃ¡y chá»§: ${error.response.status}`;
      throw new Error(errorMsg);
    } else {
      throw new Error('KhÃ´ng thá»ƒ káº¿t ná»‘i Ä‘áº¿n mÃ¡y chá»§. Vui lÃ²ng kiá»ƒm tra láº¡i máº¡ng.');
    }
  }
};

/**
 * Thu há»“i (vÃ´ hiá»‡u hÃ³a) má»™t key.
 */
export const revokeKey = async (key: string) => {
  if (!isBackendAvailable) {
    throw new Error('Chá»©c nÄƒng thu há»“i key cáº§n backend hoáº¡t Ä‘á»™ng. Vui lÃ²ng thá»­ láº¡i sau.');
  }
  
  try {
    const response = await apiClient.post('/keys/revoke', { key });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      const errorMsg = error.response.data?.message || `Lá»—i mÃ¡y chá»§: ${error.response.status}`;
      throw new Error(errorMsg);
    } else {
      throw new Error('KhÃ´ng thá»ƒ káº¿t ná»‘i Ä‘áº¿n mÃ¡y chá»§. Vui lÃ²ng kiá»ƒm tra láº¡i máº¡ng.');
    }
  }
};

/**
 * Cáº­p nháº­t (cá»™ng/trá»«) credit cho má»™t key.
 */
export const updateCredit = async (key: string, amount: number) => {
  if (!isBackendAvailable) {
    throw new Error('Chá»©c nÄƒng cáº­p nháº­t credit cáº§n backend hoáº¡t Ä‘á»™ng. Vui lÃ²ng thá»­ láº¡i sau.');
  }
  
  try {
    const response = await apiClient.post('/keys/update-credit', { key, amount });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      const errorMsg = error.response.data?.message || `Lá»—i mÃ¡y chá»§: ${error.response.status}`;
      throw new Error(errorMsg);
    } else {
      throw new Error('KhÃ´ng thá»ƒ káº¿t ná»‘i Ä‘áº¿n mÃ¡y chá»§. Vui lÃ²ng kiá»ƒm tra láº¡i máº¡ng.');
    }
  }
};

/**
 * Wake up backend vÃ  check availability
 */
export const wakeUpBackend = async () => {
  try {
    console.log('ðŸš€ Checking backend availability...');
    await apiClient.get('/health', { timeout: 5000 });
    isBackendAvailable = true;
    console.log('âœ… Backend is available!');
    return true;
  } catch (error) {
    isBackendAvailable = false;
    console.log('âš ï¸ Backend unavailable, will use mock data for read operations');
    return false;
  }
};

/**
 * Check backend status
 */
export const getBackendStatus = () => {
  return {
    isAvailable: isBackendAvailable,
    message: isBackendAvailable 
      ? 'Backend hoáº¡t Ä‘á»™ng bÃ¬nh thÆ°á»ng' 
      : 'Backend khÃ´ng kháº£ dá»¥ng - Ä‘ang sá»­ dá»¥ng dá»¯ liá»‡u demo'
  };
}; 
/**
 * ThÃªm API key vÃ o provider.
 */
export const addApiKeyToProvider = async (providerId: string, apiKey: string) => {
  if (!isBackendAvailable) {
    throw new Error('Chá»©c nÄƒng thÃªm API key cáº§n backend hoáº¡t Ä‘á»™ng. Vui lÃ²ng thá»­ láº¡i sau.');
  }
  
  try {
    if (!providerId || typeof providerId !== 'string') {
      throw new Error('ID provider khÃ´ng há»£p lá»‡.');
    }
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('API key khÃ´ng há»£p lá»‡.');
    }
    
    const response = await apiClient.post(`/providers/${providerId}/keys`, { apiKey });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      const errorMsg = error.response.data?.message || `Lá»—i mÃ¡y chá»§: ${error.response.status}`;
      throw new Error(errorMsg);
    } else {
      throw new Error('KhÃ´ng thá»ƒ káº¿t ná»‘i Ä‘áº¿n mÃ¡y chá»§. Vui lÃ²ng kiá»ƒm tra láº¡i máº¡ng.');
    }
  }
};

/**
 * XÃ³a API key khá»i provider.
 */
export const deleteApiKeyFromProvider = async (providerId: string, keyId: string) => {
  if (!isBackendAvailable) {
    throw new Error('Chá»©c nÄƒng xÃ³a API key cáº§n backend hoáº¡t Ä‘á»™ng. Vui lÃ²ng thá»­ láº¡i sau.');
  }
  
  try {
    if (!providerId || typeof providerId !== 'string') {
      throw new Error('ID provider khÃ´ng há»£p lá»‡.');
    }
    if (!keyId || typeof keyId !== 'string') {
      throw new Error('ID key khÃ´ng há»£p lá»‡.');
    }
    
    const response = await apiClient.delete(`/providers/${providerId}/keys/${keyId}`);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      const errorMsg = error.response.data?.message || `Lá»—i mÃ¡y chá»§: ${error.response.status}`;
      throw new Error(errorMsg);
    } else {
      throw new Error('KhÃ´ng thá»ƒ káº¿t ná»‘i Ä‘áº¿n mÃ¡y chá»§. Vui lÃ²ng kiá»ƒm tra láº¡i máº¡ng.');
    }
  }
}; 
export const updateKeyStatus = async (keyId: string, isActive: boolean) => {
  if (!isBackendAvailable) {
    throw new Error('Chuc nang cap nhat trang thai key can backend hoat dong. Vui long thu lai sau.');
  }
  
  try {
    if (!keyId || typeof keyId !== 'string') {
      throw new Error('ID key khong hop le.');
    }
    if (typeof isActive !== 'boolean') {
      throw new Error('Trang thai khong hop le.');
    }
    
    const response = await apiClient.put(`/keys/${keyId}/status`, { isActive });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      const errorMsg = error.response.data?.message || `Loi may chu: ${error.response.status}`;
      throw new Error(errorMsg);
    } else {
      throw new Error('Khong the ket noi den may chu. Vui long kiem tra lai mang.');
    }
  }
};

export const updateKeyDetails = async (keyId: string, payload: { note?: string; expiredAt?: string | null; credit?: number; maxActivations?: number }) => {
  if (!isBackendAvailable) {
    throw new Error('Chuc nang cap nhat thong tin key can backend hoat dong. Vui long thu lai sau.');
  }
  
  try {
    if (!keyId || typeof keyId !== 'string') {
      throw new Error('ID key khong hop le.');
    }
    
    if (payload.credit !== undefined && (typeof payload.credit !== 'number' || isNaN(payload.credit))) {
      throw new Error('So luong credit khong hop le.');
    }
    if (payload.maxActivations !== undefined && (typeof payload.maxActivations !== 'number' || isNaN(payload.maxActivations))) {
      throw new Error('So lan kich hoat toi da khong hop le.');
    }
    
    const response = await apiClient.put(`/keys/${keyId}/details`, payload);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      const errorMsg = error.response.data?.message || `Loi may chu: ${error.response.status}`;
      throw new Error(errorMsg);
    } else {
      throw new Error('Khong the ket noi den may chu. Vui long kiem tra lai mang.');
    }
  }
}; 
