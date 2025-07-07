import axios from 'axios';

// --- Base API Configuration ---
const API_BASE = process.env.REACT_APP_API_URL || "https://key-manager-backend.onrender.com/api";

const apiClient = axios.create({
  baseURL: API_BASE,
});

// --- Error Handling ---
const handleError = (error: any) => {
  if (error.response) {
    const errorMsg = error.response.data?.message || `Lỗi máy chủ: ${error.response.status}`;
    throw new Error(errorMsg);
  } else if (error.request) {
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.');
  } else {
    throw new Error(error.message || 'Lỗi không xác định.');
  }
};


// --- API Service Functions ---

/**
 * Lấy dữ liệu thống kê tổng quan cho trang Dashboard.
 */
export const fetchDashboardStats = async () => {
  try {
    const response = await apiClient.get('/stats/dashboard');
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

/**
 * Lấy danh sách tất cả các key.
 */
export const fetchKeys = async () => {
  try {
    const response = await apiClient.get('/keys');
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

/**
 * Tạo một key mới.
 */
export const createKey = async (payload: { expiredAt?: Date; maxActivations?: number; note?: string; credit?: number }) => {
  try {
    const response = await apiClient.post('/keys', payload);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

/**
 * Thu hồi (vô hiệu hóa) một key.
 */
export const revokeKey = async (key: string) => {
  try {
    const response = await apiClient.post('/keys/revoke', { key });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

/**
 * Cập nhật (cộng/trừ) credit cho một key.
 */
export const updateCredit = async (key: string, amount: number) => {
  try {
    const response = await apiClient.post('/keys/update-credit', { key, amount });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

/**
 * Lấy danh sách các nhà cung cấp API từ backend.
 */
export const fetchApiProviders = async () => {
    try {
        const response = await apiClient.get('/providers');
        return response.data;
    } catch (error) {
        handleError(error);
    }
};

/**
 * Lấy danh sách các hoạt động gần đây (audit log).
 */
export const fetchAuditLogs = async () => {
    try {
        const response = await apiClient.get('/audit-log');
        return response.data;
    } catch (error) {
        handleError(error);
    }
};