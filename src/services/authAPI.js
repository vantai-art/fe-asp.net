// src/services/authAPI.js  ← FIXED
import axios from "axios";

const API_URL = "https://chuyen-de-asp.onrender.com/api";

export const authAPI = {
    // ── Đăng ký ────────────────────────────────────────────────
    signup: async (userData) => {
        const res = await axios.post(`${API_URL}/auth/register`, userData);
        return res.data;
    },

    // ── Đăng nhập ──────────────────────────────────────────────
    // BE trả về AuthResponseDto (camelCase JSON):
    //   { token, username, role, fullName, email, phone, userId }
    login: async (credentials) => {
        const res = await axios.post(`${API_URL}/auth/login`, credentials);
        const data = res.data;

        // BE dùng camelCase (ASP.NET Core mặc định), hỗ trợ cả PascalCase phòng trường hợp config khác
        const token = data.token || data.Token;
        const role = (data.role || data.Role || "").trim();
        const userId = data.userId || data.UserId;
        const username = data.username || data.Username;
        const fullName = data.fullName || data.FullName;

        if (!token) throw new Error("Server không trả về token");

        const roleLower = role.toLowerCase();

        if (roleLower === "admin") {
            localStorage.setItem("admin_token", token);
            localStorage.setItem("admin_user", JSON.stringify({ id: userId, username, role, fullName }));
            localStorage.setItem("isAdminAuth", "true");
        } else if (roleLower === "staff") {
            localStorage.setItem("staff_token", token);
            localStorage.setItem("staff_user", JSON.stringify({ id: userId, username, role, fullName }));
        } else {
            // Customer
            localStorage.setItem("user_token", token);
            localStorage.setItem("user_user", JSON.stringify({ id: userId, username, role, fullName }));
        }

        return data;
    },

    // ── Đăng xuất ──────────────────────────────────────────────
    logout: () => {
        [
            "admin_token", "staff_token", "user_token", "jwt_token",
            "admin_user", "staff_user", "user_user", "user", "isAdminAuth",
        ].forEach((k) => localStorage.removeItem(k));
    },

    // ── Lấy token hiện tại ─────────────────────────────────────
    getToken: () =>
        localStorage.getItem("admin_token") ||
        localStorage.getItem("staff_token") ||
        localStorage.getItem("user_token") ||
        localStorage.getItem("jwt_token"),

    // ── Lấy user hiện tại ──────────────────────────────────────
    getCurrentUser: () => {
        const raw =
            localStorage.getItem("admin_user") ||
            localStorage.getItem("staff_user") ||
            localStorage.getItem("user_user") ||
            localStorage.getItem("user");
        try { return raw ? JSON.parse(raw) : null; } catch { return null; }
    },

    getCurrentRole: () => {
        if (localStorage.getItem("admin_token")) return "Admin";
        if (localStorage.getItem("staff_token")) return "Staff";
        if (localStorage.getItem("user_token")) return "Customer";
        return null;
    },

    isAuthenticated: () => !!authAPI.getToken(),
    isAdmin: () => !!localStorage.getItem("admin_token"),
    isStaff: () => !!localStorage.getItem("staff_token"),
};
