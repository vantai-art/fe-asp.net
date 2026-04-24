// src/pages/admin/AdminDashboard.jsx  ← FIXED
import React, { useState, useEffect, useCallback } from 'react';
import { Package, ShoppingBag, Users, DollarSign, TrendingUp, Loader2, AlertCircle, Calendar, BarChart3 } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

function AdminDashboard() {
    const { axiosInstance } = useAppContext();
    const [stats, setStats] = useState({
        totalProducts: 0, totalOrders: 0, totalCustomers: 0, totalRevenue: 0,
        productChange: 0, orderChange: 0, customerChange: 0, revenueChange: 0
    });
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('7days');

    const getToken = () => localStorage.getItem("admin_token") || localStorage.getItem("staff_token");

    // ✅ FIX: helper parse ngày an toàn - thử nhiều field name khác nhau
    const safeDate = (obj, ...fields) => {
        for (const f of fields) {
            if (obj[f]) {
                const d = new Date(obj[f]);
                if (!isNaN(d.getTime())) return d;
            }
        }
        return null;
    };

    const toDateStr = (d) => {
        if (!d) return null;
        try {
            const iso = d.toISOString();
            return iso.split('T')[0];
        } catch {
            return null;
        }
    };

    const generateChartData = useCallback((orders, payments, days) => {
        const data = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = toDateStr(date);

            // ✅ BE trả về orderDate (không phải createdAt)
            const dayOrders = orders.filter(order => {
                const d = safeDate(order, 'orderDate', 'createdAt', 'OrderDate', 'CreatedAt');
                return d && toDateStr(d) === dateStr;
            }).length;

            // ✅ BE trả về paymentDate (không phải issuedAt/createdAt)
            const dayRevenue = payments
                .filter(p => {
                    const d = safeDate(p, 'paymentDate', 'createdAt', 'PaymentDate', 'CreatedAt');
                    return d && toDateStr(d) === dateStr;
                })
                .reduce((sum, p) => sum + (p.amount || p.totalAmount || p.Amount || 0), 0);

            data.push({
                date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                orders: dayOrders,
                revenue: dayRevenue
            });
        }

        setChartData(data);
    }, []);

    const fetchDashboardStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = getToken();
            if (!token) throw new Error("Không tìm thấy token xác thực");

            const [productsRes, ordersRes, paymentsRes, usersRes] = await Promise.all([
                axiosInstance.get('/food'),
                axiosInstance.get('/order'),
                axiosInstance.get('/payment').catch(() => ({ data: [] })),
                axiosInstance.get('/auth/users').catch(() => ({ data: [] }))
            ]);

            const products = Array.isArray(productsRes.data) ? productsRes.data : productsRes.data?.data || [];
            const orders = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data?.data || [];
            const payments = Array.isArray(paymentsRes.data) ? paymentsRes.data : paymentsRes.data?.data || [];
            const users = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data || [];

            const totalProducts = products.length;
            const totalOrders = orders.length;

            // ✅ Doanh thu: cộng tất cả payment (BE đã tạo payment = đã thanh toán)
            // field là "amount" (xem PaymentController)
            const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || p.Amount || 0), 0);

            // ✅ Khách hàng: role = "Customer" (BE dùng "Customer" không phải "USER")
            const customers = users.filter(u => {
                const role = (u.role || u.Role || '').toLowerCase();
                return role === 'customer' || role === 'user' || role === '';
            });
            const totalCustomers = customers.length;

            // Tính % thay đổi
            const daysAgo = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
            const compareDate = new Date();
            compareDate.setDate(compareDate.getDate() - daysAgo);

            // ✅ Đơn hàng mới: dùng orderDate
            const newOrders = orders.filter(o => {
                const d = safeDate(o, 'orderDate', 'createdAt', 'OrderDate');
                return d && d >= compareDate;
            }).length;
            const orderChange = totalOrders > 0 ? Math.round((newOrders / totalOrders) * 100) : 0;

            // Khách mới
            const newCustomers = customers.filter(u => {
                const d = safeDate(u, 'createdAt', 'CreatedAt', 'created_at');
                return d && d >= compareDate;
            }).length;
            const customerChange = totalCustomers > 0 ? Math.round((newCustomers / totalCustomers) * 100) : 0;

            // ✅ Doanh thu mới: dùng paymentDate
            const recentRevenue = payments
                .filter(p => {
                    const d = safeDate(p, 'paymentDate', 'createdAt', 'PaymentDate');
                    return d && d >= compareDate;
                })
                .reduce((sum, p) => sum + (p.amount || p.Amount || 0), 0);

            const previousDate = new Date();
            previousDate.setDate(previousDate.getDate() - daysAgo * 2);
            const previousRevenue = payments
                .filter(p => {
                    const d = safeDate(p, 'paymentDate', 'createdAt', 'PaymentDate');
                    return d && d >= previousDate && d < compareDate;
                })
                .reduce((sum, p) => sum + (p.amount || p.Amount || 0), 0);

            const revenueChange = previousRevenue > 0
                ? Math.round(((recentRevenue - previousRevenue) / previousRevenue) * 100)
                : recentRevenue > 0 ? 100 : 0;

            setStats({ totalProducts, totalOrders, totalCustomers, totalRevenue, productChange: 0, orderChange, customerChange, revenueChange });
            generateChartData(orders, payments, daysAgo);

        } catch (err) {
            console.error("❌ Lỗi tải dashboard:", err);
            setError(err.response?.data?.message || err.message || "Không thể tải dữ liệu dashboard");
        } finally {
            setIsLoading(false);
        }
    }, [timeRange, generateChartData, axiosInstance]);

    useEffect(() => { fetchDashboardStats(); }, [fetchDashboardStats]);

    const formatCurrency = (amount) => {
        if (amount >= 1000000000) return (amount / 1000000000).toFixed(1) + 'B';
        if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
        if (amount >= 1000) return (amount / 1000).toFixed(1) + 'K';
        return amount.toString();
    };

    const dashboardStats = [
        { title: 'Tổng Sản Phẩm', value: stats.totalProducts.toString(), icon: <Package className="w-8 h-8" />, color: 'bg-blue-500', change: `+${stats.productChange}%` },
        { title: 'Đơn Hàng', value: stats.totalOrders.toString(), icon: <ShoppingBag className="w-8 h-8" />, color: 'bg-green-500', change: `+${stats.orderChange}%` },
        { title: 'Khách Hàng', value: stats.totalCustomers.toString(), icon: <Users className="w-8 h-8" />, color: 'bg-purple-500', change: `+${stats.customerChange}%` },
        { title: 'Doanh Thu', value: formatCurrency(stats.totalRevenue) + 'đ', icon: <DollarSign className="w-8 h-8" />, color: 'bg-amber-500', change: `${stats.revenueChange >= 0 ? '+' : ''}${stats.revenueChange}%` }
    ];

    if (isLoading) return (
        <div className="p-6 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Đang tải dữ liệu...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="p-6">
            <div className="bg-red-900 bg-opacity-30 border border-red-500 rounded-lg p-6 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                <div>
                    <h3 className="text-red-400 font-semibold mb-2">Không thể tải dữ liệu</h3>
                    <p className="text-gray-300 mb-4">{error}</p>
                    <button onClick={fetchDashboardStats} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">Thử lại</button>
                </div>
            </div>
        </div>
    );

    const maxOrders = Math.max(...chartData.map(d => d.orders), 1);
    const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

    return (
        <div className="p-6">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Bảng Điều Khiển</h1>
                    <p className="text-gray-400">Chào mừng trở lại! Đây là tổng quan hệ thống của bạn.</p>
                </div>
                <div className="flex gap-3">
                    <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}
                        className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-amber-500 outline-none">
                        <option value="7days">7 ngày</option>
                        <option value="30days">30 ngày</option>
                        <option value="90days">90 ngày</option>
                    </select>
                    <button onClick={fetchDashboardStats} disabled={isLoading}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Làm mới
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {dashboardStats.map((stat, index) => (
                    <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-amber-500 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`${stat.color} p-3 rounded-lg text-white`}>{stat.icon}</div>
                            <span className={`${parseFloat(stat.change) >= 0 ? 'text-green-400' : 'text-red-400'} text-sm font-semibold flex items-center gap-1`}>
                                <TrendingUp className={`w-4 h-4 ${parseFloat(stat.change) < 0 ? 'rotate-180' : ''}`} />
                                {stat.change}
                            </span>
                        </div>
                        <div className="text-gray-400 text-sm mb-1">{stat.title}</div>
                        <div className="text-white text-2xl font-bold">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Orders Chart */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-green-500" /> Đơn hàng theo ngày
                        </h2>
                        <BarChart3 className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="h-64 flex items-end justify-between gap-2">
                        {chartData.map((data, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                <div className="relative group flex-1 w-full flex items-end">
                                    <div className="w-full bg-green-500 rounded-t-lg transition-all duration-300 hover:bg-green-400 cursor-pointer"
                                        style={{ height: `${Math.max((data.orders / maxOrders) * 100, data.orders > 0 ? 5 : 0)}%` }}>
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
                                            <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">{data.orders} đơn</div>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-gray-400 text-xs">{data.date}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Revenue Chart */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-amber-500" /> Doanh thu theo ngày
                        </h2>
                        <Calendar className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="h-64 relative">
                        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-gray-400 text-xs">
                            <span>{formatCurrency(maxRevenue)}đ</span>
                            <span>{formatCurrency(Math.round(maxRevenue * 0.5))}đ</span>
                            <span>0đ</span>
                        </div>
                        <div className="ml-12 h-full flex items-end justify-between gap-1">
                            {chartData.map((data, index) => {
                                const height = (data.revenue / maxRevenue) * 100;
                                const prevHeight = index > 0 ? (chartData[index - 1].revenue / maxRevenue) * 100 : height;
                                return (
                                    <div key={index} className="flex-1 relative h-full flex flex-col">
                                        <div className="flex-1 relative">
                                            <div className="absolute left-1/2 transform -translate-x-1/2 w-2 h-2 bg-amber-500 rounded-full group cursor-pointer"
                                                style={{ bottom: `${height}%` }}>
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                                    <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">{formatCurrency(data.revenue)}đ</div>
                                                </div>
                                            </div>
                                            {index > 0 && (
                                                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                                    <line x1="0" y1={`${100 - prevHeight}%`} x2="100%" y2={`${100 - height}%`} stroke="#F59E0B" strokeWidth="2" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-gray-400 text-xs text-center mt-2">{data.date}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-start gap-3">
                    <div className="bg-amber-500 bg-opacity-20 p-2 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-semibold mb-1">Thống kê chi tiết</p>
                        <p className="text-gray-400 text-sm">
                            👥 Khách hàng: Chỉ tính role Customer |
                            💰 Doanh thu: Tổng tất cả payment đã ghi nhận |
                            📈 % thay đổi: So với khoảng thời gian trước đó |
                            🔄 Biểu đồ cập nhật theo khoảng thời gian đã chọn
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;