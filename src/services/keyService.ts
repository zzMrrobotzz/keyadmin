import axios from 'axios';
import { mockDataService, simulateNetworkDelay } from './mockDataService';

// --- Base API Configuration ---
const API_BASE = process.env.REACT_APP_API_URL || "/api";

const apiClient = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Flag to track backend status
let isBackendAvailable = true;

// Retry interceptor with fallback logic
apiClient.interceptors.response.use(
    (response) => {
        isBackendAvailable = true;
        return response;
    },
    async (error) => {
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
            console.log('Backend unavailable, using mock data');
            await simulateNetworkDelay(800);
            return mockData;
        }
        const result = await apiCall();
        return result;
    } catch (error) {
        console.error('API call failed, falling back to mock data:', error);
        isBackendAvailable = false;
        await simulateNetworkDelay(500);
        return mockData;
    }
};

// --- API Service Functions with Fallback ---
export const fetchDashboardStats = async () => {
    return withFallback(
        () => apiClient.get('/stats/dashboard').then(res => res.data),
        mockDataService.dashboardStats
    );
};

export const fetchKeys = async () => {
    return withFallback(
        () => apiClient.get('/keys').then(res => res.data),
        mockDataService.keys
    );
};

export const fetchApiProviders = async () => {
    return withFallback(
        () => apiClient.get('/providers').then(res => res.data),
        mockDataService.apiProviders
    );
};

export const fetchAuditLogs = async () => {
    return withFallback(
        () => apiClient.get('/audit-log').then(res => res.data),
        mockDataService.auditLogs
    );
};

export const fetchPackages = async () => {
    return withFallback(
        () => apiClient.get('/packages').then(res => res.data),
        mockDataService.packages
    );
};

// --- Write Operations (Backend Only) ---
const handleWriteError = (error: any, context: string) => {
    if (!isBackendAvailable) {
        throw new Error(`Chức năng ${context} cần backend hoạt động. Vui lòng thử lại sau.`);
    }
    if (error.response) {
        const errorMsg = error.response.data?.message || `Lỗi máy chủ: ${error.response.status}`;
        throw new Error(errorMsg);
    } else {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.');
    }
};

export const createKey = async (payload: { key: string; expiredAt?: Date; maxActivations?: number; note?: string; credit?: number }) => {
    try {
        const response = await apiClient.post('/keys', payload);
        return response.data;
    } catch (error) {
        handleWriteError(error, 'tạo key');
    }
};

export const revokeKey = async (key: string) => {
    try {
        const response = await apiClient.post('/keys/revoke', { key });
        return response.data;
    } catch (error) {
        handleWriteError(error, 'thu hồi key');
    }
};

export const updateCredit = async (key: string, amount: number) => {
    try {
        const response = await apiClient.post('/keys/update-credit', { key, amount });
        return response.data;
    } catch (error) {
        handleWriteError(error, 'cập nhật credit');
    }
};

export const updateKeyDetails = async (keyId: string, payload: { note?: string; expiredAt?: string | null; credit?: number; maxActivations?: number }) => {
    try {
        const response = await apiClient.put(`/keys/${keyId}/details`, payload);
        return response.data;
    } catch (error) {
        handleWriteError(error, 'cập nhật chi tiết key');
    }
};

export const updateKeyStatus = async (keyId: string, isActive: boolean) => {
    try {
        const response = await apiClient.put(`/keys/${keyId}/status`, { isActive });
        return response.data;
    } catch (error) {
        handleWriteError(error, 'cập nhật trạng thái key');
    }
};

export const addApiKeyToProvider = async (providerId: string, apiKey: { key: string; nickname: string }) => {
    try {
        const response = await apiClient.post(`/providers/${providerId}/keys`, apiKey);
        return response.data;
    } catch (error) {
        handleWriteError(error, 'thêm API key');
    }
};

export const deleteApiKeyFromProvider = async (providerId: string, apiKeyId: string) => {
    try {
        const response = await apiClient.delete(`/providers/${providerId}/keys/${apiKeyId}`);
        return response.data;
    } catch (error) {
        handleWriteError(error, 'xóa API key');
    }
};

export const createApiProvider = async (name: string) => {
    try {
        const response = await apiClient.post('/providers', { name });
        return response.data;
    } catch (error) {
        handleWriteError(error, 'tạo API provider');
    }
};