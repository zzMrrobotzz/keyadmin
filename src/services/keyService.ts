import axios from 'axios';

// --- Base API Configuration ---
const API_BASE = process.env.REACT_APP_API_URL || "/api";

const apiClient = axios.create({
    baseURL: API_BASE,
    timeout: 30000, // 30 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Mock Data for Fallback ---
const mockData = {
    dashboardStats: {
        totalKeys: 150,
        activeKeys: 120,
        totalRevenue: 2500000,
        monthlyRevenue: 450000,
        keyUsage: [
            { date: '2024-01', count: 45 },
            { date: '2024-02', count: 52 },
            { date: '2024-03', count: 48 },
            { date: '2024-04', count: 61 },
            { date: '2024-05', count: 58 },
            { date: '2024-06', count: 67 }
        ]
    },
    keys: [
        {
            id: '1',
            key: 'sk-1234567890abcdef',
            provider: 'OpenAI',
            status: 'active',
            credits: 1000,
            usedCredits: 250,
            createdAt: '2024-01-15T10:30:00Z',
            lastUsed: '2024-06-20T14:22:00Z'
        },
        {
            id: '2',
            key: 'sk-0987654321fedcba',
            provider: 'Anthropic',
            status: 'active',
            credits: 500,
            usedCredits: 180,
            createdAt: '2024-02-10T09:15:00Z',
            lastUsed: '2024-06-19T16:45:00Z'
        }
    ],
    providers: [
        { id: '1', name: 'OpenAI', status: 'active', keyCount: 5 },
        { id: '2', name: 'Anthropic', status: 'active', keyCount: 3 },
        { id: '3', name: 'Google', status: 'inactive', keyCount: 2 }
    ],
    auditLogs: [
        {
            id: '1',
            action: 'CREATE_KEY',
            userId: 'admin',
            details: 'Created new API key for OpenAI',
            timestamp: '2024-06-20T15:30:00Z'
        },
        {
            id: '2',
            action: 'UPDATE_CREDITS',
            userId: 'admin',
            details: 'Updated credits for key sk-1234567890abcdef',
            timestamp: '2024-06-20T14:22:00Z'
        }
    ],
    packages: [
        {
            id: '1',
            name: 'Basic Package',
            price: 100000,
            credits: 1000,
            duration: 30,
            status: 'active'
        },
        {
            id: '2',
            name: 'Premium Package',
            price: 250000,
            credits: 3000,
            duration: 30,
            status: 'active'
        }
    ]
};

// --- Backend Status Tracking ---
let isBackendAvailable = true;
let lastBackendCheck = 0;
const BACKEND_CHECK_INTERVAL = 60000; // 1 minute

export const getBackendStatus = () => isBackendAvailable;

const checkBackendStatus = async () => {
    const now = Date.now();
    if (now - lastBackendCheck < BACKEND_CHECK_INTERVAL) {
        return isBackendAvailable;
    }

    try {
        await apiClient.get('/status');
        isBackendAvailable = true;
        lastBackendCheck = now;
        return true;
    } catch (error) {
        console.warn('Backend unavailable, using fallback data:', error.message);
        isBackendAvailable = false;
        lastBackendCheck = now;
        return false;
    }
};

// --- Centralized Error Handler with Fallback ---
const handleApiCall = async (apiCall: () => Promise<any>, fallbackData: any, context: string) => {
    try {
        const isAvailable = await checkBackendStatus();
        if (!isAvailable) {
            console.log(`Using fallback data for ${context}`);
            return fallbackData;
        }

        const result = await apiCall();
        return result;
    } catch (error) {
        console.error(`API Error in ${context}:`, error);
        console.log(`Falling back to mock data for ${context}`);
        return fallbackData;
    }
};

// --- API Functions with Fallback ---

export const fetchDashboardStats = async () => {
    return handleApiCall(
        async () => {
            const { data } = await apiClient.get('/stats/dashboard');
            return data;
        },
        mockData.dashboardStats,
        'fetchDashboardStats'
    );
};

export const fetchKeys = async () => {
    return handleApiCall(
        async () => {
            const { data } = await apiClient.get('/admin/keys');
            return data;
        },
        mockData.keys,
        'fetchKeys'
    );
};

export const fetchApiProviders = async () => {
    return handleApiCall(
        async () => {
            const { data } = await apiClient.get('/providers');
            return data;
        },
        mockData.providers,
        'fetchApiProviders'
    );
};

export const fetchAuditLogs = async () => {
    return handleApiCall(
        async () => {
            const { data } = await apiClient.get('/audit-log');
            return data;
        },
        mockData.auditLogs,
        'fetchAuditLogs'
    );
};

export const fetchPackages = async () => {
    return handleApiCall(
        async () => {
            const { data } = await apiClient.get('/packages');
            return data;
        },
        mockData.packages,
        'fetchPackages'
    );
};

// --- Write Operations with Error Handling ---

export const createKey = async (payload: any) => {
    try {
        const isAvailable = await checkBackendStatus();
        if (!isAvailable) {
            throw new Error('Backend không khả dụng. Vui lòng thử lại sau.');
        }
        const { data } = await apiClient.post('/admin/keys', payload);
        return data;
    } catch (error) {
        console.error('Error creating key:', error);
        throw new Error(error.response?.data?.message || 'Không thể tạo key. Vui lòng thử lại.');
    }
};

export const updateCredit = async (key: string, amount: number) => {
    try {
        const isAvailable = await checkBackendStatus();
        if (!isAvailable) {
            throw new Error('Backend không khả dụng. Vui lòng thử lại sau.');
        }
        const { data } = await apiClient.post('/admin/keys/update-credit', { key, amount });
        return data;
    } catch (error) {
        console.error('Error updating credit:', error);
        throw new Error(error.response?.data?.message || 'Không thể cập nhật credit. Vui lòng thử lại.');
    }
};

export const updateKeyDetails = async (keyId: string, payload: any) => {
    try {
        const isAvailable = await checkBackendStatus();
        if (!isAvailable) {
            throw new Error('Backend không khả dụng. Vui lòng thử lại sau.');
        }
        const { data } = await apiClient.put(`/admin/keys/${keyId}/details`, payload);
        return data;
    } catch (error) {
        console.error('Error updating key details:', error);
        throw new Error(error.response?.data?.message || 'Không thể cập nhật thông tin key. Vui lòng thử lại.');
    }
};

export const updateKeyStatus = async (keyId: string, isActive: boolean) => {
    try {
        const isAvailable = await checkBackendStatus();
        if (!isAvailable) {
            throw new Error('Backend không khả dụng. Vui lòng thử lại sau.');
        }
        const { data } = await apiClient.put(`/admin/keys/${keyId}/status`, { isActive });
        return data;
    } catch (error) {
        console.error('Error updating key status:', error);
        throw new Error(error.response?.data?.message || 'Không thể cập nhật trạng thái key. Vui lòng thử lại.');
    }
};

export const createApiProvider = async (name: string) => {
    try {
        const isAvailable = await checkBackendStatus();
        if (!isAvailable) {
            throw new Error('Backend không khả dụng. Vui lòng thử lại sau.');
        }
        const { data } = await apiClient.post('/providers', { name });
        return data;
    } catch (error) {
        console.error('Error creating provider:', error);
        throw new Error(error.response?.data?.message || 'Không thể tạo provider. Vui lòng thử lại.');
    }
};

export const addApiKeyToProvider = async (providerId: string, apiKey: any) => {
    try {
        const isAvailable = await checkBackendStatus();
        if (!isAvailable) {
            throw new Error('Backend không khả dụng. Vui lòng thử lại sau.');
        }
        const { data } = await apiClient.post(`/providers/${providerId}/keys`, apiKey);
        return data;
    } catch (error) {
        console.error('Error adding key to provider:', error);
        throw new Error(error.response?.data?.message || 'Không thể thêm key vào provider. Vui lòng thử lại.');
    }
};

export const deleteApiKeyFromProvider = async (providerId: string, apiKeyId: string) => {
    try {
        const isAvailable = await checkBackendStatus();
        if (!isAvailable) {
            throw new Error('Backend không khả dụng. Vui lòng thử lại sau.');
        }
        const { data } = await apiClient.delete(`/providers/${providerId}/keys/${apiKeyId}`);
        return data;
    } catch (error) {
        console.error('Error deleting key from provider:', error);
        throw new Error(error.response?.data?.message || 'Không thể xóa key khỏi provider. Vui lòng thử lại.');
    }
};

export const createPackage = async (pkg: any) => {
    try {
        const isAvailable = await checkBackendStatus();
        if (!isAvailable) {
            throw new Error('Backend không khả dụng. Vui lòng thử lại sau.');
        }
        const { data } = await apiClient.post('/packages', pkg);
        return data;
    } catch (error) {
        console.error('Error creating package:', error);
        throw new Error(error.response?.data?.message || 'Không thể tạo package. Vui lòng thử lại.');
    }
};

export const updatePackage = async (packageId: string, pkg: any) => {
    try {
        const isAvailable = await checkBackendStatus();
        if (!isAvailable) {
            throw new Error('Backend không khả dụng. Vui lòng thử lại sau.');
        }
        const { data } = await apiClient.put(`/packages/${packageId}`, pkg);
        return data;
    } catch (error) {
        console.error('Error updating package:', error);
        throw new Error(error.response?.data?.message || 'Không thể cập nhật package. Vui lòng thử lại.');
    }
};

export const deletePackage = async (packageId: string) => {
    try {
        const isAvailable = await checkBackendStatus();
        if (!isAvailable) {
            throw new Error('Backend không khả dụng. Vui lòng thử lại sau.');
        }
        const { data } = await apiClient.delete(`/packages/${packageId}`);
        return data;
    } catch (error) {
        console.error('Error deleting package:', error);
        throw new Error(error.response?.data?.message || 'Không thể xóa package. Vui lòng thử lại.');
    }
};

// --- Backend Wake-up Function ---
export const wakeUpBackend = async () => {
    try {
        await apiClient.get('/status');
        isBackendAvailable = true;
        lastBackendCheck = Date.now();
        return true;
    } catch (error) {
        isBackendAvailable = false;
        lastBackendCheck = Date.now();
        console.warn('Backend wakeup failed:', error.message);
        return false;
    }
}; 