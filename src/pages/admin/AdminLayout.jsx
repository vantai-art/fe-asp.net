import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LogOut, Menu, X, LayoutDashboard, Package,
    ShoppingBag, FolderOpen, Users, Shield,
    Settings, Coffee, Table, Tag
} from 'lucide-react';
import AdminUsers from './AdminUsers';
import AdminStaff from './AdminStaff';
import AdminPromotions from './AdminPromotions';

function AdminLayout({ children, currentPage, setCurrentPage, onLogout }) {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const menuItems = [
        { id: 'dashboard', label: 'Tổng Quan', icon: <LayoutDashboard className="w-5 h-5" /> },
        { id: 'products', label: 'Sản Phẩm', icon: <Package className="w-5 h-5" /> },
        { id: 'categories', label: 'Danh Mục', icon: <FolderOpen className="w-5 h-5" /> },
        { id: 'tables', label: 'Quản Lý Bàn', icon: <Table className="w-5 h-5" /> },
        { id: 'orders', label: 'Đơn Hàng', icon: <ShoppingBag className="w-5 h-5" /> },
        { id: 'users', label: 'Khách Hàng', icon: <Users className="w-5 h-5" /> },
        { id: 'staff', label: 'Nhân Viên', icon: <Shield className="w-5 h-5" /> },
        { id: 'promotions', label: 'Khuyến Mãi', icon: <Tag className="w-5 h-5" /> },
        { id: 'settings', label: 'Cài Đặt', icon: <Settings className="w-5 h-5" /> }
    ];

    const handleMenuClick = (itemId) => {
        console.log('📍 Menu clicked:', itemId);
        setCurrentPage(itemId);
    };

    const handleLogout = () => {
        if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
            localStorage.removeItem('isAdminAuth');
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user');
            onLogout();
            navigate('/admin/login');
        }
    };

    // Render nội dung theo currentPage
    const renderContent = () => {
        switch (currentPage) {
            case 'users':
                return <AdminUsers />;
            case 'staff':
                return <AdminStaff />;
            case 'promotions':
                return <AdminPromotions />;
            default:
                return children;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex">
            {/* Sidebar */}
            <aside className={`bg-gray-800 border-r border-gray-700 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'
                } fixed h-full z-40`}>
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
                    {sidebarOpen && (
                        <div className="flex items-center space-x-2">
                            <Coffee className="w-8 h-8 text-amber-500" />
                            <div className="text-white">
                                <div className="text-lg font-bold">FOOD AND DRINK</div>
                                <div className="text-xs text-gray-400">Admin Panel</div>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Menu Items */}
                <nav className="p-4 space-y-2">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleMenuClick(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentPage === item.id
                                ? 'bg-amber-600 text-white shadow-lg'
                                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                }`}
                            title={!sidebarOpen ? item.label : ''}
                        >
                            {item.icon}
                            {sidebarOpen && <span className="font-medium">{item.label}</span>}
                        </button>
                    ))}
                </nav>

                {/* Logout Button */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title={!sidebarOpen ? 'Đăng Xuất' : ''}
                    >
                        <LogOut className="w-5 h-5" />
                        {sidebarOpen && <span className="font-medium">Đăng Xuất</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
                {/* Top Bar */}
                <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6 sticky top-0 z-30">
                    <div>
                        <h1 className="text-white text-xl font-bold">
                            {menuItems.find(item => item.id === currentPage)?.label || 'Tổng Quan'}
                        </h1>
                        <p className="text-gray-400 text-sm">
                            {new Date().toLocaleDateString('vi-VN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-white font-medium">Admin</div>
                            <div className="text-gray-400 text-sm">admin@coffeeblend.com</div>
                        </div>
                        <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold">
                            A
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="min-h-[calc(100vh-4rem)] bg-gray-900">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}

export default AdminLayout;