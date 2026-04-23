// App.jsx - FULL FIXED VERSION
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from './contexts/AppContext';

// Import Components
import Header from './components/Header';
import StaffPage from './pages/staff/StaffPage';
import StaffLoginPage from './pages/staff/StaffLoginPage';
import StaffRegister from './pages/staff/StaffRegister';

// Import User Pages
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import ShopPage from './pages/ShopPage';
import UserAuthPage from './pages/UserAuthPage';
import UserOrdersPage from './pages/UserOrdersPage';

// Import Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminTable from './pages/admin/AdminTable';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';


// 🧹===================== TOKEN AUTO-CLEANER =======================
try {
  const staffToken = localStorage.getItem("staff_token");
  const adminToken = localStorage.getItem("admin_token");

  const checkTokenExpired = (tokenKey, tokenValue) => {
    if (!tokenValue) return;
    try {
      const payload = JSON.parse(atob(tokenValue.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) {
        console.warn(`⚠️ ${tokenKey} hết hạn, xóa khỏi localStorage`);
        localStorage.removeItem(tokenKey);
        if (tokenKey === "staff_token") {
          localStorage.removeItem("staff_user");
          localStorage.removeItem("staff_role");
          alert("Phiên đăng nhập của nhân viên đã hết hạn. Vui lòng đăng nhập lại.");
          window.location.href = "/staff/login";
        }
        if (tokenKey === "admin_token") {
          localStorage.removeItem("admin_user");
          localStorage.removeItem("isAdminAuth");
          alert("Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại.");
          window.location.href = "/admin/login";
        }
      }
    } catch (err) {
      console.error(`❌ Lỗi khi parse ${tokenKey}:`, err);
      localStorage.removeItem(tokenKey);
    }
  };

  checkTokenExpired("staff_token", staffToken);
  checkTokenExpired("admin_token", adminToken);
} catch (e) {
  console.error("Lỗi kiểm tra token:", e);
}
// =================================================================


// ✅ Protected Staff Route Component
function ProtectedStaffRoute({ children }) {
  const token = localStorage.getItem("staff_token");

  if (!token) {
    console.log("⚠️ Không có staff_token, chuyển hướng về trang login");
    return <Navigate to="/staff/login" replace />;
  }

  return children;
}

// ✅ Admin Routes Wrapper
function AdminRoutes() {
  const { setIsAdminAuthenticated } = useAppContext();
  const [currentAdminPage, setCurrentAdminPage] = React.useState('dashboard');

  const handleLogout = () => {
    console.log("🚪 Admin logout");
    setIsAdminAuthenticated(false);
    localStorage.removeItem('isAdminAuth');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/admin/login';
  };

  const renderAdminPage = () => {
    switch (currentAdminPage) {
      case 'dashboard': return <AdminDashboard />;
      case 'products': return <AdminProducts />;
      case 'categories': return <AdminCategories />;
      case 'tables': return <AdminTable />;
      case 'orders': return <AdminOrders />;
      case 'users': return <AdminUsers />;
      case 'settings': return <AdminSettings />;
      case 'staff-register': return <StaffRegister />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <AdminLayout
      currentPage={currentAdminPage}
      setCurrentPage={setCurrentAdminPage}
      onLogout={handleLogout}
    >
      {renderAdminPage()}
    </AdminLayout>
  );
}


// ========================== APP ROUTES ==========================
function App() {
  return (
    <div className="App">
      <Routes>

        {/* ---------- USER ROUTES ---------- */}
        <Route
          path="/"
          element={
            <>
              <Header />
              <HomePage />
            </>
          }
        />
        <Route
          path="/menu"
          element={
            <>
              <Header />
              <MenuPage />
            </>
          }
        />
        <Route
          path="/shop"
          element={
            <>
              <Header />
              <ShopPage />
            </>
          }
        />
        <Route
          path="/my-orders"
          element={
            <>
              <Header />
              <UserOrdersPage />
            </>
          }
        />
        <Route
          path="/auth"
          element={
            <>
              <Header />
              <UserAuthPage />
            </>
          }
        />

        {/* ---------- STAFF ROUTES ---------- */}
        <Route path="/staff/login" element={<StaffLoginPage />} />
        <Route
          path="/staff"
          element={
            <ProtectedStaffRoute>
              <StaffPage />
            </ProtectedStaffRoute>
          }
        />

        {/* ---------- ADMIN ROUTES ---------- */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminRoutes />
            </ProtectedAdminRoute>
          }
        />

        {/* ---------- 404 NOT FOUND ---------- */}
        <Route
          path="*"
          element={
            <>
              <Header />
              <div className="min-h-screen bg-black pt-20 flex items-center justify-center">
                <div className="text-center text-white">
                  <h1 className="text-6xl font-bold mb-4">404</h1>
                  <p className="text-xl mb-8">Trang không tồn tại</p>
                  <a
                    href="/"
                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded"
                  >
                    Về Trang Chủ
                  </a>
                </div>
              </div>
            </>
          }
        />

      </Routes>
    </div>
  );
}

export default App;
