// src/components/ProtectedAdminRoute.jsx
import { Navigate, useLocation } from "react-router-dom";

function ProtectedAdminRoute({ children }) {
    const location = useLocation();

    // ✅ CHO PHÉP /admin/login không cần check
    if (location.pathname === '/admin/login') {
        return children;
    }

    // ✅ LẤY TOKEN VÀ PARSE PAYLOAD
    const token = localStorage.getItem("admin_token");

    if (!token) {
        console.warn("⚠️ Không có admin_token, chuyển về /admin/login");
        return <Navigate to="/admin/login" replace />;
    }

    try {
        // ✅ PARSE JWT PAYLOAD ĐỂ LẤY ROLE
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.role || payload.authority || payload.authorities?.[0];

        console.log("🔐 ProtectedAdminRoute Check:");
        console.log("  📍 Path:", location.pathname);
        console.log("  🔑 Token exists:", true);
        console.log("  👤 Role from JWT:", role);

        // ✅ CHECK ROLE (hỗ trợ cả ADMIN và ROLE_ADMIN)
        const isAdmin = role === "ADMIN" || role === "ROLE_ADMIN";

        if (!isAdmin) {
            console.warn("🚫 Không có quyền ADMIN (role=" + role + ")");
            alert("⚠️ Bạn không có quyền truy cập trang Admin!");
            localStorage.removeItem("admin_token");
            localStorage.removeItem("admin_user");
            localStorage.removeItem("isAdminAuth");
            return <Navigate to="/admin/login" replace />;
        }

        // ✅ Kiểm tra token có hết hạn không
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.warn("⏰ Token đã hết hạn");
            alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
            localStorage.removeItem("admin_token");
            localStorage.removeItem("admin_user");
            localStorage.removeItem("isAdminAuth");
            return <Navigate to="/admin/login" replace />;
        }

        console.log("✅ Admin access granted");
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