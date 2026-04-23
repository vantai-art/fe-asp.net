// src/services/api.js
import axios from 'axios';
import { authAPI } from './authAPI';

// ✅ URL mới: BE deploy trên Render
const API_BASE_URL = 'https://chuyen-de-asp.onrender.com/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // Tăng timeout vì Render free tier có thể chậm khi cold start
});

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        const token = authAPI.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(`📡 [${config.method.toUpperCase()}] ${config.url}`);
        return config;
    },
    (error) => {
        console.error('❌ Request error:', error);
        return Promise.reject(error);
    }
);

// Response Interceptor
api.interceptors.response.use(
    (response) => {
        console.log(`✅ Response from ${response.config.url}:`, response.data);
        return response;
    },
    (error) => {
        console.error('❌ Response error:', error.response?.status, error.message);
        if (error.response?.status === 401) {
            authAPI.logout();
            window.location.href = '/admin/login';
        }
        return Promise.reject(error);
    }
);

// ==================== FOOD (Products) ====================
// BE mới dùng /food thay vì /products
export const productAPI = {
    getAll: (categoryId) => categoryId
        ? api.get(`/food?categoryId=${categoryId}`)
        : api.get('/food'),
    getAvailable: (categoryId) => categoryId
        ? api.get(`/food/available?categoryId=${categoryId}`)
        : api.get('/food/available'),
    getById: (id) => api.get(`/food/${id}`),
    create: (product) => api.post('/food', product),
    update: (id, product) => api.put(`/food/${id}`, product),
    delete: (id) => api.delete(`/food/${id}`),
    toggle: (id) => api.patch(`/food/${id}/toggle`),
    getByCategory: (categoryId) => api.get(`/food?categoryId=${categoryId}`),
};

// ==================== CATEGORIES ====================
// BE mới dùng /category (số ít) thay vì /categories
export const categoryAPI = {
    getAll: () => api.get('/category'),
    getById: (id) => api.get(`/category/${id}`),
    create: (category) => api.post('/category', category),
    update: (id, category) => api.put(`/category/${id}`, category),
    delete: (id) => api.delete(`/category/${id}`),
};

// ==================== ORDERS ====================
// BE mới dùng /order (số ít)
export const orderAPI = {
    getAll: (status) => status
        ? api.get(`/order?status=${status}`)
        : api.get('/order'),
    getById: (id) => api.get(`/order/${id}`),
    create: (order) => api.post('/order', order),
    updateStatus: (id, status) => api.patch(`/order/${id}/status`, { status }),
    delete: (id) => api.delete(`/order/${id}`),
};

// ==================== ORDER ITEMS ====================
// BE mới không có /order-items riêng - items nằm trong GET /order/{id}
export const orderItemAPI = {
    getByOrderId: (orderId) => api.get(`/order/${orderId}`).then(res => ({
        ...res,
        data: res.data?.orderDetails || res.data?.OrderDetails || [],
    })),
    create: () => Promise.reject(new Error('Dùng orderAPI.create với trường items[] thay thế')),
    update: () => Promise.reject(new Error('Không hỗ trợ cập nhật order item riêng lẻ')),
    delete: () => Promise.reject(new Error('Không hỗ trợ xóa order item riêng lẻ')),
};

// ==================== TABLES ====================
// BE mới dùng /table (số ít) thay vì /tables
export const tableAPI = {
    getAll: (status) => status
        ? api.get(`/table?status=${status}`)
        : api.get('/table'),
    getById: (id) => api.get(`/table/${id}`),
    create: (table) => api.post('/table', table),
    update: (id, table) => api.put(`/table/${id}`, table),
    updateStatus: (id, status) => api.put(`/table/${id}`, { id, status }),
    delete: (id) => api.delete(`/table/${id}`),
};

// ==================== PROMOTIONS ====================
// BE mới dùng /promotion (số ít)
export const promotionAPI = {
    getAll: () => api.get('/promotion'),
    getAllAdmin: () => api.get('/promotion/all'),
    getActive: () => api.get('/promotion'),
    getById: (id) => api.get(`/promotion/${id}`),
    create: (promotion) => api.post('/promotion', promotion),
    update: () => Promise.reject(new Error('Dùng toggle để bật/tắt. BE không có PUT /promotion/{id}')),
    delete: (id) => api.delete(`/promotion/${id}`),
    toggle: (id) => api.patch(`/promotion/${id}/toggle`),
    apply: (code, orderAmount) => api.post('/promotion/apply', { code, orderAmount }),
};

// ==================== BILLS / PAYMENT ====================
// BE mới dùng /payment thay vì /bills
export const billAPI = {
    getAll: (from, to) => {
        const params = [];
        if (from) params.push(`from=${from}`);
        if (to) params.push(`to=${to}`);
        return api.get(`/payment${params.length ? '?' + params.join('&') : ''}`);
    },
    getById: (orderId) => api.get(`/payment/order/${orderId}`),
    getByOrderId: (orderId) => api.get(`/payment/order/${orderId}`),
    create: (bill) => api.post('/payment', bill),
    updateStatus: () => Promise.reject(new Error('BE mới không hỗ trợ cập nhật trạng thái payment')),
};

// ==================== USERS ====================
// BE mới: users quản lý qua /auth/*
export const userAPI = {
    getAll: () => api.get('/auth/users'),
    getMe: () => api.get('/auth/me'),
    create: (user) => api.post('/auth/register', user),
    getById: () => Promise.reject(new Error('Không có GET /auth/users/{id}')),
    update: () => Promise.reject(new Error('Không có PUT /auth/users/{id}')),
    delete: () => Promise.reject(new Error('Dùng toggle để vô hiệu hóa tài khoản')),
    toggle: (id) => api.patch(`/auth/users/${id}/toggle`),
};

// ==================== AUTH ====================
export const authEndpoints = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    me: () => api.get('/auth/me'),
};

// ==================== THỐNG KÊ (MỚI) ====================
export const statisticsAPI = {
    getSummary: () => api.get('/statistics/summary'),
    getRevenue: (year, month) => {
        let url = `/statistics/revenue?year=${year}`;
        if (month) url += `&month=${month}`;
        return api.get(url);
    },
    getTopFoods: (limit = 10) => api.get(`/statistics/top-foods?limit=${limit}`),
    getDailyRevenue: (date) => date
        ? api.get(`/statistics/revenue/daily?date=${date}`)
        : api.get('/statistics/revenue/daily'),
};

// ==================== ĐẶT BÀN (MỚI) ====================
export const reservationAPI = {
    getAll: (status, date) => {
        const params = [];
        if (status) params.push(`status=${status}`);
        if (date) params.push(`date=${date}`);
        return api.get(`/reservation${params.length ? '?' + params.join('&') : ''}`);
    },
    getToday: () => api.get('/reservation/today'),
    getById: (id) => api.get(`/reservation/${id}`),
    create: (reservation) => api.post('/reservation', reservation),
    updateStatus: (id, statusData) => api.patch(`/reservation/${id}/status`, statusData),
    delete: (id) => api.delete(`/reservation/${id}`),
};

// ==================== ĐÁNH GIÁ (MỚI) ====================
export const reviewAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/review${query ? '?' + query : ''}`);
    },
    getSummary: () => api.get('/review/summary'),
    create: (review) => api.post('/review', review),
    reply: (id, replyComment) => api.patch(`/review/${id}/reply`, { replyComment }),
    toggle: (id) => api.patch(`/review/${id}/toggle`),
};

// ==================== THÔNG BÁO (MỚI) ====================
export const notificationAPI = {
    getAll: (unreadOnly = false) => api.get(`/notification${unreadOnly ? '?unreadOnly=true' : ''}`),
    getUnreadCount: () => api.get('/notification/unread-count'),
    markRead: (id) => api.patch(`/notification/${id}/read`),
    markAllRead: () => api.patch('/notification/read-all'),
    broadcast: (title, message) => api.post('/notification/broadcast', { title, message }),
};

export default api;
