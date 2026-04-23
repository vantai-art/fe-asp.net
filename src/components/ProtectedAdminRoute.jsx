// src/components/ProtectedAdminRoute.jsx
import { Navigate, useLocation } from "react-router-dom";

function ProtectedAdminRoute({ children }) {
    const location = useLocation();

    if (location.pathname === '/admin/login') {
        return children;
    }

    const token = localStorage.getItem("admin_token");

    if (!token) {
        console.warn("⚠️ Không có admin_token, chuyển về /admin/login");
        return <Navigate to="/admin/login" replace />;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));

        // ✅ FIX: .NET JWT dùng claim name dài, hỗ trợ cả hai format
        const role =
            payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
            payload.role ||
            payload.authority ||
            payload.authorities?.[0];

        console.log("🔐 ProtectedAdminRoute - Role from JWT:", role);

        // ✅ FIX: Backend trả về "Admin" (viết hoa chữ đầu), không phải "ADMIN"
        const isAdmin = role === "Admin" || role === "ADMIN" || role === "ROLE_ADMIN";

        if (!isAdmin) {
            console.warn("🚫 Không có quyền Admin (role=" + role + ")");
            alert("⚠️ Tài khoản này không có quyền truy cập Admin!");
            localStorage.removeItem("admin_token");
            localStorage.removeItem("admin_user");
            localStorage.removeItem("isAdminAuth");
            return <Navigate to="/admin/login" replace />;
        }

        if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.warn("⏰ Token đã hết hạn");
            alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
            localStorage.removeItem("admin_token");
            localStorage.removeItem("admin_user");
            localStorage.removeItem("isAdminAuth");
            return <Navigate to="/admin/login" replace />;
        }

        return children;

    } catch (error) {
        console.error("❌ Lỗi parse JWT token:", error);
        alert("Token không hợp lệ. Vui lòng đăng nhập lại!");
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        localStorage.removeItem("isAdminAuth");
        return <Navigate to="/admin/login" replace />;
    }
}

export default ProtectedAdminRoute;
