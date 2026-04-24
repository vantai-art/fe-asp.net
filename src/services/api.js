// src/services/api.js  ← FIXED
import axios from "axios";
import { authAPI } from "./authAPI";

const API_BASE_URL = "https://chuyen-de-asp.onrender.com/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
    timeout: 30000,
});

// ── Request Interceptor ────────────────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = authAPI.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response Interceptor ───────────────────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            authAPI.logout();
            if (window.location.pathname.startsWith("/admin")) {
                window.location.href = "/admin/login";
            } else if (window.location.pathname.startsWith("/staff")) {
                window.location.href = "/staff/login";
            }
        }
        return Promise.reject(error);
    }
);

// ==================== FOOD (Products) ====================
// BE: GET /food, POST /food, PUT /food/{id}, DELETE /food/{id}, PATCH /food/{id}/toggle
export const productAPI = {
    getAll: (categoryId) =>
        categoryId ? api.get(`/food?categoryId=${categoryId}`) : api.get("/food"),
    getAvailable: (categoryId) =>
        categoryId ? api.get(`/food/available?categoryId=${categoryId}`) : api.get("/food/available"),
    getById: (id) => api.get(`/food/${id}`),

    // ✅ FIX: Food model có: Id, Name, Description, Price, ImageUrl, IsAvailable, CategoryId
    //         KHÔNG có StockQuantity
    create: (product) =>
        api.post("/food", {
            name: product.name,
            description: product.description || "",
            price: Number(product.price),
            imageUrl: product.imageUrl || "",
            isAvailable: product.isAvailable !== undefined ? product.isAvailable : true,
            categoryId: Number(product.categoryId),
        }),

    // ✅ FIX: PUT yêu cầu id trong body phải khớp với id trong URL
    update: (id, product) =>
        api.put(`/food/${id}`, {
            id: Number(id),
            name: product.name,
            description: product.description || "",
            price: Number(product.price),
            imageUrl: product.imageUrl || "",
            isAvailable: product.isAvailable !== undefined ? product.isAvailable : true,
            categoryId: Number(product.categoryId),
        }),

    delete: (id) => api.delete(`/food/${id}`),
    toggle: (id) => api.patch(`/food/${id}/toggle`),
};

// ==================== CATEGORIES ====================
// BE: GET /category, GET /category/{id}, POST /category, PUT /category/{id}, DELETE /category/{id}
// Category model: Id, Name, Description  (KHÔNG có ImageUrl, Color - những field đó chỉ ở FE)
export const categoryAPI = {
    getAll: () => api.get("/category"),
    getById: (id) => api.get(`/category/${id}`),

    // ✅ FIX: chỉ gửi các field mà BE Category model có
    create: (category) =>
        api.post("/category", {
            name: category.name,
            description: category.description || "",
        }),

    // ✅ FIX: PUT yêu cầu id trong body phải khớp với id trong URL
    update: (id, category) =>
        api.put(`/category/${id}`, {
            id: Number(id),
            name: category.name,
            description: category.description || "",
        }),

    delete: (id) => api.delete(`/category/${id}`),
};

// ==================== ORDERS ====================
export const orderAPI = {
    getAll: (status) =>
        status ? api.get(`/order?status=${status}`) : api.get("/order"),
    getById: (id) => api.get(`/order/${id}`),
    create: (order) => api.post("/order", order),
    updateStatus: (id, status) => api.patch(`/order/${id}/status`, { status }),
    delete: (id) => api.delete(`/order/${id}`),
};

// ==================== ORDER ITEMS ====================
export const orderItemAPI = {
    getByOrderId: (orderId) =>
        api.get(`/order/${orderId}`).then((res) => ({
            ...res,
            data: res.data?.orderDetails || res.data?.OrderDetails || [],
        })),
    create: () => Promise.reject(new Error("Dùng orderAPI.create với trường items[] thay thế")),
    update: () => Promise.reject(new Error("Không hỗ trợ cập nhật order item riêng lẻ")),
    delete: () => Promise.reject(new Error("Không hỗ trợ xóa order item riêng lẻ")),
};

// ==================== TABLES ====================
export const tableAPI = {
    getAll: (status) =>
        status ? api.get(`/table?status=${status}`) : api.get("/table"),
    getById: (id) => api.get(`/table/${id}`),
    create: (table) => api.post("/table", table),
    update: (id, table) => api.put(`/table/${id}`, table),
    updateStatus: (id, status) => api.put(`/table/${id}`, { id, status }),
    delete: (id) => api.delete(`/table/${id}`),
};

// ==================== PROMOTIONS ====================
export const promotionAPI = {
    getAll: () => api.get("/promotion"),
    getAllAdmin: () => api.get("/promotion/all"),
    getActive: () => api.get("/promotion"),
    getById: (id) => api.get(`/promotion/${id}`),
    create: (promotion) => api.post("/promotion", promotion),
    delete: (id) => api.delete(`/promotion/${id}`),
    toggle: (id) => api.patch(`/promotion/${id}/toggle`),
    apply: (code, orderAmount) => api.post("/promotion/apply", { code, orderAmount }),
};

// ==================== BILLS / PAYMENT ====================
export const billAPI = {
    getAll: (from, to) => {
        const params = [];
        if (from) params.push(`from=${from}`);
        if (to) params.push(`to=${to}`);
        return api.get(`/payment${params.length ? "?" + params.join("&") : ""}`);
    },
    getById: (orderId) => api.get(`/payment/order/${orderId}`),
    getByOrderId: (orderId) => api.get(`/payment/order/${orderId}`),
    create: (bill) => api.post("/payment", bill),
};

// ==================== USERS ====================
export const userAPI = {
    getAll: () => api.get("/auth/users"),
    getMe: () => api.get("/auth/me"),
    create: (user) => api.post("/auth/register", user),
    toggle: (id) => api.patch(`/auth/users/${id}/toggle`),
};

// ==================== AUTH ====================
export const authEndpoints = {
    login: (credentials) => api.post("/auth/login", credentials),
    register: (userData) => api.post("/auth/register", userData),
    registerStaff: (userData) => api.post("/auth/register-staff", userData),
    me: () => api.get("/auth/me"),
};

// ==================== THỐNG KÊ ====================
export const statisticsAPI = {
    getSummary: () => api.get("/statistics/summary"),
    getRevenue: (year, month) => {
        let url = `/statistics/revenue?year=${year}`;
        if (month) url += `&month=${month}`;
        return api.get(url);
    },
    getTopFoods: (limit = 10) => api.get(`/statistics/top-foods?limit=${limit}`),
    getDailyRevenue: (date) =>
        date
            ? api.get(`/statistics/revenue/daily?date=${date}`)
            : api.get("/statistics/revenue/daily"),
};

// ==================== ĐẶT BÀN ====================
export const reservationAPI = {
    getAll: (status, date) => {
        const params = [];
        if (status) params.push(`status=${status}`);
        if (date) params.push(`date=${date}`);
        return api.get(`/reservation${params.length ? "?" + params.join("&") : ""}`);
    },
    getToday: () => api.get("/reservation/today"),
    getById: (id) => api.get(`/reservation/${id}`),
    create: (reservation) => api.post("/reservation", reservation),
    updateStatus: (id, statusData) => api.patch(`/reservation/${id}/status`, statusData),
    delete: (id) => api.delete(`/reservation/${id}`),
};

// ==================== ĐÁNH GIÁ ====================
export const reviewAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/review${query ? "?" + query : ""}`);
    },
    getSummary: () => api.get("/review/summary"),
    create: (review) => api.post("/review", review),
    reply: (id, replyComment) => api.patch(`/review/${id}/reply`, { replyComment }),
    toggle: (id) => api.patch(`/review/${id}/toggle`),
};

// ==================== THÔNG BÁO ====================
export const notificationAPI = {
    getAll: (unreadOnly = false) =>
        api.get(`/notification${unreadOnly ? "?unreadOnly=true" : ""}`),
    getUnreadCount: () => api.get("/notification/unread-count"),
    markRead: (id) => api.patch(`/notification/${id}/read`),
    markAllRead: () => api.patch("/notification/read-all"),
    broadcast: (title, message) => api.post("/notification/broadcast", { title, message }),
};

export default api;
