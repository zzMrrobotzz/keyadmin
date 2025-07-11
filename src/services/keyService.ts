import axios from 'axios';

// --- Base API Configuration ---
const API_BASE = process.env.REACT_APP_API_URL || "/api";

const apiClient = axios.create({
    baseURL: API_BASE,
    timeout: 15000, // Increased timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Centralized Error Handler ---
const handleApiError = (error: any, context: string) => {
    console.error(`API Error in ${context}:`, error);
    if (error.response) {
        const errorMsg = error.response.data?.message || `Lỗi máy chủ: ${error.response.status}`;
        throw new Error(errorMsg);
    } else if (error.request) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    } else {
        throw new Error(error.message || 'Lỗi không xác định. Vui lòng thử lại.');
    }
};

// --- Backend Status ---
let isBackendAwake = false;
export const getBackendStatus = () => isBackendAwake;

export const wakeUpBackend = async () => {
    try {
        await apiClient.get('/status');
        isBackendAwake = true;
        return true;
    } catch (error) {
        isBackendAwake = false;
        console.error("Backend wakeup call failed:", error);
        return false;
    }
};

// --- Read Operations ---
export const fetchDashboardStats = async () => {
    try {
        const { data } = await apiClient.get('/stats/dashboard');
        return data;
    } catch (error) {
        handleApiError(error, 'fetchDashboardStats');
    }
};

export const fetchKeys = async () => {
    try {
        const { data } = await apiClient.get('/keys');
        return data;
    } catch (error) {
        handleApiError(error, 'fetchKeys');
    }
};

export const fetchApiProviders = async () => {
    try {
        const { data } = await apiClient.get('/providers');
        return data;
    } catch (error) {
        handleApiError(error, 'fetchApiProviders');
    }
};

export const fetchAuditLogs = async () => {
    try {
        const { data } = await apiClient.get('/audit-log');
        return data;
    } catch (error) {
        handleApiError(error, 'fetchAuditLogs');
    }
};

export const fetchPackages = async () => {
    try {
        const { data } = await apiClient.get('/packages');
        return data;
    } catch (error) {
        handleApiError(error, 'fetchPackages');
    }
};

// --- Write Operations ---

// Key Management
export const createKey = async (payload: any) => {
    try {
        const { data } = await apiClient.post('/keys', payload);
        return data;
    } catch (error) {
        handleApiError(error, 'createKey');
    }
};

export const updateCredit = async (key: string, amount: number) => {
    try {
        const { data } = await apiClient.post('/keys/update-credit', { key, amount });
        return data;
    } catch (error) {
        handleApiError(error, 'updateCredit');
    }
};

export const updateKeyDetails = async (keyId: string, payload: any) => {
    try {
        const { data } = await apiClient.put(`/keys/${keyId}/details`, payload);
        return data;
    } catch (error) {
        handleApiError(error, 'updateKeyDetails');
    }
};

export const updateKeyStatus = async (keyId: string, isActive: boolean) => {
    try {
        const { data } = await apiClient.put(`/keys/${keyId}/status`, { isActive });
        return data;
    } catch (error) {
        handleApiError(error, 'updateKeyStatus');
    }
};

// Provider Management
export const createApiProvider = async (name: string) => {
    try {
        const { data } = await apiClient.post('/providers', { name });
        return data;
    } catch (error) {
        handleApiError(error, 'createApiProvider');
    }
};

export const addApiKeyToProvider = async (providerId: string, apiKey: any) => {
    try {
        const { data } = await apiClient.post(`/providers/${providerId}/keys`, apiKey);
        return data;
    } catch (error) {
        handleApiError(error, 'addApiKeyToProvider');
    }
};

export const deleteApiKeyFromProvider = async (providerId: string, apiKeyId: string) => {
    try {
        const { data } = await apiClient.delete(`/providers/${providerId}/keys/${apiKeyId}`);
        return data;
    } catch (error) {
        handleApiError(error, 'deleteApiKeyFromProvider');
    }
};

// Package Management
export const createPackage = async (pkg: any) => {
    try {
        const { data } = await apiClient.post('/packages', pkg);
        return data;
    } catch (error) {
        handleApiError(error, 'createPackage');
    }
};

export const updatePackage = async (packageId: string, pkg: any) => {
    try {
        const { data } = await apiClient.put(`/packages/${packageId}`, pkg);
        return data;
    } catch (error) {
        handleApiError(error, 'updatePackage');
    }
};

export const deletePackage = async (packageId: string) => {
    try {
        const { data } = await apiClient.delete(`/packages/${packageId}`);
        return data;
    } catch (error) {
        handleApiError(error, 'deletePackage');
    }
};
