// src/services/authAPI.js
import axios from "axios";

// ✅ URL mới: BE deploy trên Render
const API_URL = "https://chuyen-de-asp.onrender.com/api";

export const authAPI = {
    // ⚠️ BE mới KHÔNG có /auth/signup - chỉ admin tạo tài khoản qua /auth/register
    signup: async (userData) => {
        try {
            const res = await axios.post(`${API_URL}/auth/register`, userData);
            return res.data;
        } catch (err) {
            console.error("❌ Register error:", err);
            throw err;
        }
    },

    login: async (credentials) => {
        try {
            const res = await axios.post(`${API_URL}/auth/login`, credentials);
            const data = res.data;

            if (data.token) {
                // BE mới trả về role là "Admin" hoặc "Staff" (viết hoa chữ đầu)
                switch (data.role) {
                    case "Admin":
                    case "ADMIN":
                        localStorage.setItem("admin_token", data.token);
                        localStorage.setItem("admin_user", JSON.stringify(data));
                        localStorage.setItem("isAdminAuth", "true");
                        break;

                    case "Staff":
                    case "STAFF":
                    case "EMPLOYEE":
                        localStorage.setItem("staff_token", data.token);
                        localStorage.setItem("staff_user", JSON.stringify(data));
                        break;

                    default:
                        localStorage.setItem("user_token", data.token);
                        localStorage.setItem("user_user", JSON.stringify(data));
                        break;
                }
            }

            return data;
        } catch (err) {
            console.error("❌ Login error:", err);
            throw err;
        }
    },

    logout: () => {
        [
            "admin_token",
            "staff_token",
            "user_token",
            "jwt_token",
            "admin_user",
            "staff_user",
            "user_user",
            "user",
            "isAdminAuth",
        ].forEach((k) => localStorage.removeItem(k));
    },

    getToken: () =>
        localStorage.getItem("admin_token") ||
        localStorage.getItem("staff_token") ||
        localStorage.getItem("user_token") ||
        localStorage.getItem("jwt_token"),

    getCurrentUser: () => {
        const user =
            localStorage.getItem("admin_user") ||
            localStorage.getItem("staff_user") ||
            localStorage.getItem("user_user") ||
            localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated: () => !!authAPI.getToken(),
};
