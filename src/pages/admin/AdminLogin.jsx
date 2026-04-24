// src/pages/admin/AdminLogin.jsx  ← FIXED
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Coffee, AlertCircle, Eye, EyeOff } from "lucide-react";

const API_URL = "https://chuyen-de-asp.onrender.com/api";

function AdminLogin() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);

    // Nếu đã đăng nhập rồi thì redirect luôn
    useEffect(() => {
        const token = localStorage.getItem("admin_token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                // Kiểm tra token chưa hết hạn
                if (payload.exp * 1000 > Date.now()) {
                    navigate("/admin", { replace: true });
                } else {
                    // Token hết hạn → xóa
                    localStorage.removeItem("admin_token");
                    localStorage.removeItem("admin_user");
                    localStorage.removeItem("isAdminAuth");
                }
            } catch {
                localStorage.removeItem("admin_token");
                localStorage.removeItem("admin_user");
                localStorage.removeItem("isAdminAuth");
            }
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: formData.username.trim(),
                    password: formData.password,
                }),
            });

            // Đọc body dù là lỗi
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                // BE trả về { message: "..." } khi lỗi
                throw new Error(data.message || `Lỗi ${response.status}: Đăng nhập thất bại`);
            }

            // ✅ BE trả về: { token, username, role, fullName, email, phone, userId }
            // Lưu ý: BE dùng PascalCase trong AuthResponseDto nhưng JSON serializer
            // của ASP.NET Core mặc định ra camelCase → token, username, role, userId
            const token = data.token || data.Token;
            const role = data.role || data.Role || "";
            const userId = data.userId || data.UserId;
            const username = data.username || data.Username;
            const fullName = data.fullName || data.FullName;

            if (!token) {
                throw new Error("Server không trả về token. Vui lòng thử lại!");
            }

            // ✅ Kiểm tra role phải là "Admin"
            if (role !== "Admin" && role !== "ADMIN") {
                throw new Error("Tài khoản này không có quyền Admin!");
            }

            // ✅ Lưu vào localStorage
            localStorage.setItem("admin_token", token);
            localStorage.setItem("admin_user", JSON.stringify({ id: userId, username, role, fullName }));
            localStorage.setItem("isAdminAuth", "true");

            // Chuyển trang
            navigate("/admin", { replace: true });

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
                        <div className="mb-6 bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{error}</span>
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
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full bg-gray-700 text-white pl-12 pr-4 py-3 rounded-lg border border-gray-600 focus:border-amber-500 outline-none transition-colors"
                                    placeholder="Nhập tên đăng nhập"
                                    autoComplete="username"
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
                                    type={showPw ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-gray-700 text-white pl-12 pr-12 py-3 rounded-lg border border-gray-600 focus:border-amber-500 outline-none transition-colors"
                                    placeholder="Nhập mật khẩu"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || !formData.username || !formData.password}
                            className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" />
                                    <span>Đang đăng nhập...</span>
                                </>
                            ) : (
                                "Đăng nhập"
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate("/")}
                            className="text-gray-400 hover:text-amber-500 transition-colors text-sm"
                        >
                            ← Quay về trang chủ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;
