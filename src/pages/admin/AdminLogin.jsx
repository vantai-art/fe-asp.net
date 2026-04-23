// src/pages/admin/AdminLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Coffee, AlertCircle } from "lucide-react";

function AdminLogin() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            console.log("🔐 Attempting admin login...");

            const response = await fetch("https://chuyen-de-asp.onrender.com/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Đăng nhập thất bại");
            }

            const data = await response.json();
            console.log("✅ Login response:", data);

            // ✅ KIỂM TRA ROLE
            const userRole = data.role || data.user?.role;
            console.log("👤 User role:", userRole);

            // ✅ FIX: Backend trả về "Admin" (viết hoa chữ đầu)
            if (userRole !== "Admin" && userRole !== "ADMIN") {
                throw new Error("⚠️ Tài khoản này không có quyền Admin!");
            }

            // ✅ LƯU TOKEN VÀ USER INFO
            localStorage.setItem("admin_token", data.token);
            localStorage.setItem("admin_user", JSON.stringify({
                id: data.id || data.userId,
                username: data.username,
                role: userRole
            }));
            localStorage.setItem("isAdminAuth", "true");

            console.log("✅ Admin logged in successfully");

            // ✅ CHUYỂN HƯỚNG
            setTimeout(() => {
                navigate("/admin", { replace: true });
            }, 100);

        } catch (err) {
            console.error("❌ Login error:", err);
            setError(err.message || "Đăng nhập thất bại. Vui lòng thử lại!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-600 rounded-full mb-4">
                        <Coffee className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
                    <p className="text-gray-400">Đăng nhập vào hệ thống quản trị</p>
                </div>

                {/* Login Form */}
                <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 p-8">
                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username */}
                        <div>
                            <label className="text-white block mb-2 font-medium">
                                Tên đăng nhập
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData({ ...formData, username: e.target.value })
                                    }
                                    className="w-full bg-gray-700 text-white pl-12 pr-4 py-3 rounded-lg border border-gray-600 focus:border-amber-500 outline-none"
                                    placeholder="Nhập tên đăng nhập"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-white block mb-2 font-medium">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                    className="w-full bg-gray-700 text-white pl-12 pr-4 py-3 rounded-lg border border-gray-600 focus:border-amber-500 outline-none"
                                    placeholder="Nhập mật khẩu"
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                                    <span>Đang đăng nhập...</span>
                                </>
                            ) : (
                                "Đăng nhập"
                            )}
                        </button>
                    </form>

                    {/* Back to Home */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate("/")}
                            className="text-gray-400 hover:text-amber-500 transition-colors"
                        >
                            ← Quay về trang chủ
                        </button>
                    </div>
                </div>

                {/* Debug Info (Development only) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 text-center text-xs text-gray-500">
                        Hint: username=admin, password=admin
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminLogin;