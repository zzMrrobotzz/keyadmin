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

// Flag để track backend status
let isBackendAvailable = true;

// Retry interceptor với fallback logic
apiClient.interceptors.response.use(
  (response) => {
    isBackendAvailable = true; // Backend hoạt động
    return response;
  },
  async (error) => {
    const { config } = error;
    
    // Nếu là lỗi network hoặc timeout, mark backend unavailable
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
      console.log('🔄 Backend unavailable, using mock data');
      await simulateNetworkDelay(800); // Simulate realistic delay
      return mockData;
    }
    
    const result = await apiCall();
    return result;
  } catch (error) {
    console.error('❌ API call failed, falling back to mock data:', error);
    isBackendAvailable = false;
    await simulateNetworkDelay(500);
    return mockData;
  }
};

// --- API Service Functions với Fallback ---

/**
 * Lấy dữ liệu thống kê tổng quan cho trang Dashboard.
 */
export const fetchDashboardStats = async () => {
  return withFallback(
    () => apiClient.get('/stats/dashboard').then(res => res.data),
    mockDataService.dashboardStats
  );
};

/**
 * Lấy danh sách tất cả các key.
 */
export const fetchKeys = async () => {
  return withFallback(
    () => apiClient.get('/keys').then(res => res.data),
    mockDataService.keys
  );
};

/**
 * Lấy danh sách các nhà cung cấp API từ backend.
 */
export const fetchApiProviders = async () => {
  return withFallback(
    () => apiClient.get('/providers').then(res => res.data),
    mockDataService.apiProviders
  );
};

/**
 * Lấy danh sách các hoạt động gần đây (audit log).
 */
export const fetchAuditLogs = async () => {
  return withFallback(
    () => apiClient.get('/audit-log').then(res => res.data),
    mockDataService.auditLogs
  );
};

/**
 * Lấy danh sách tất cả các gói cước.
 */
export const fetchPackages = async () => {
  return withFallback(
    () => apiClient.get('/packages').then(res => res.data),
    mockDataService.packages
  );
};

// --- Write Operations (Backend Only) ---

/**
 * Tạo một key mới.
 */
export const createKey = async (payload: { key: string; expiredAt?: Date; maxActivations?: number; note?: string; credit?: number }) => {
  if (!isBackendAvailable) {
    throw new Error('Chức năng tạo key cần backend hoạt động. Vui lòng thử lại sau.');
  }
  
  try {
    const response = await apiClient.post('/keys', payload);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      const errorMsg = error.response.data?.message || `Lỗi máy chủ: ${error.response.status}`;
      throw new Error(errorMsg);
    } else {
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.');
    }
  }
};

/**
 * Thu hồi (vô hiệu hóa) một key.
 */
export const revokeKey = async (key: string) => {
  if (!isBackendAvailable) {
    throw new Error('Chức năng thu hồi key cần backend hoạt động. Vui lòng thử lại sau.');
  }
  
  try {
    const response = await apiClient.post('/keys/revoke', { key });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      const errorMsg = error.response.data?.message || `Lỗi máy chủ: ${error.response.status}`;
      throw new Error(errorMsg);
    } else {
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.');
    }
  }
};

/**
 * Cập nhật (cộng/trừ) credit cho một key.
 */
export const updateCredit = async (key: string, amount: number) => {
  if (!isBackendAvailable) {
    throw new Error('Chức năng cập nhật credit cần backend hoạt động. Vui lòng thử lại sau.');
  }
  
  try {
    const response = await apiClient.post('/keys/update-credit', { key, amount });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      const errorMsg = error.response.data?.message || `Lỗi máy chủ: ${error.response.status}`;
      throw new Error(errorMsg);
    } else {
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.');
    }
  }
};

/**
 * Wake up backend và check availability
 */
export const wakeUpBackend = async () => {
  try {
    console.log('🚀 Checking backend availability...');
    await apiClient.get('/health', { timeout: 5000 });
    isBackendAvailable = true;
    console.log('✅ Backend is available!');
    return true;
  } catch (error) {
    isBackendAvailable = false;
    console.log('⚠️ Backend unavailable, will use mock data for read operations');
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
      ? 'Backend hoạt động bình thường' 
      : 'Backend không khả dụng - đang sử dụng dữ liệu demo'
  };
}; 