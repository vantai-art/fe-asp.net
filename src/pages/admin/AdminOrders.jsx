import React, { useState, useEffect } from 'react';
import { Search, Eye, Trash2, Package, Clock, CheckCircle, XCircle, Filter, RefreshCw } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

function AdminOrders() {
    const { axiosInstance } = useAppContext();
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tất cả');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const statusOptions = ['Tất cả', 'COMPLETED'];

    const getToken = () => localStorage.getItem('admin_token');

    // 🔍 DEBUG: Decode JWT token để xem role
    const decodeToken = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('❌ Lỗi decode token:', e);
            return null;
        }
    };

    // ✅ Fetch orders từ database
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = getToken();
            if (!token) {
                console.error('❌ Không có token - Vui lòng đăng nhập lại!');
                alert('⚠️ Phiên đăng nhập hết hạn! Vui lòng đăng nhập lại.');
                return;
            }

            // 🔍 DEBUG: Kiểm tra token
            const decoded = decodeToken(token);
            console.log('🔍 Token decoded:', decoded);
            console.log('🔍 User role:', decoded?.role || decoded?.authorities);

            const res = await axiosInstance.get('/order', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            let data = res.data?.data || res.data;
            if (!Array.isArray(data)) {
                data = data ? [data] : [];
            }

            console.log("✅ Orders loaded:", data.length);
            setOrders(data);

        } catch (error) {
            console.error("❌ Lỗi tải đơn hàng:", error);

            if (error.response) {
                console.error("Response error:", error.response.status, error.response.data);

                if (error.response.status === 403) {
                    alert('❌ Không có quyền truy cập! Vui lòng kiểm tra token hoặc đăng nhập lại.');
                } else if (error.response.status === 401) {
                    alert('⚠️ Phiên hết hạn! Vui lòng đăng nhập lại.');
                } else {
                    alert(`❌ Lỗi: ${error.response.data?.message || 'Không thể tải dữ liệu'}`);
                }
            } else if (error.request) {
                console.error("❌ Không nhận được phản hồi từ server");
                alert('❌ Không thể kết nối đến server!');
            }

            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const getStatusColor = (status) => {
        return 'bg-green-500/20 text-green-400 border-green-500/50';
    };

    const getStatusIcon = (status) => {
        return <CheckCircle className="w-4 h-4" />;
    };

    const getStatusText = (status) => {
        const statusMap = {
            'PENDING': 'Hoàn thành',
            'PROCESSING': 'Hoàn thành',
            'COMPLETED': 'Hoàn thành',
            'CANCELLED': 'Hoàn thành'
        };
        return statusMap[status?.toUpperCase()] || 'Hoàn thành';
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const token = getToken();

            // 🔍 DEBUG
            console.log('🔄 Updating order:', orderId, 'to status:', newStatus);
            const decoded = decodeToken(token);
            console.log('🔍 Current user role:', decoded?.role || decoded?.authorities);

            // BE mới dùng PATCH /order/{id}/status
            await axiosInstance.patch(`/order/${orderId}/status`,
                { status: newStatus },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            setOrders(orders.map(order =>
                order.id === orderId ? { ...order, status: newStatus } : order
            ));

            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }

            alert('✅ Cập nhật trạng thái thành công!');
        } catch (err) {
            console.error('❌ Lỗi cập nhật trạng thái:', err);
            console.error('📋 Error details:', {
                status: err.response?.status,
                data: err.response?.data,
                message: err.message
            });
            alert(`❌ Không thể cập nhật trạng thái! Error: ${err.response?.status || 'Unknown'}`);
        }
    };

    const deleteOrder = async (orderId) => {
        if (!window.confirm('Bạn có chắc muốn xóa đơn hàng này?')) return;

        try {
            const token = getToken();

            // 🔍 DEBUG
            console.log('🗑️ Deleting order:', orderId);
            const decoded = decodeToken(token);
            console.log('🔍 Current user role:', decoded?.role || decoded?.authorities);
            console.log('🔑 Token preview:', token.substring(0, 30) + '...');

            const response = await axiosInstance.delete(`/order/${orderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('✅ Delete successful:', response.data);

            setOrders(orders.filter(order => order.id !== orderId));

            if (selectedOrder?.id === orderId) {
                setShowDetailModal(false);
                setSelectedOrder(null);
            }

            alert('✅ Xóa đơn hàng thành công!');
        } catch (err) {
            console.error('❌ Lỗi xóa đơn hàng:', err);
            console.error('📋 Full error details:', {
                status: err.response?.status,
                statusText: err.response?.statusText,
                data: err.response?.data,
                headers: err.response?.headers,
                config: {
                    url: err.config?.url,
                    method: err.config?.method,
                    headers: err.config?.headers
                }
            });

            alert(`❌ Không thể xóa đơn hàng! 
Error: ${err.response?.status || 'Unknown'}
Message: ${err.response?.data?.message || err.message}`);
        }
    };

    const viewOrderDetail = async (order) => {
        try {
            const token = getToken();

            // BE mới: GET /order/{id} đã include orderDetails bên trong
            const orderRes = await axiosInstance.get(`/order/${order.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const fullOrder = orderRes.data?.data || orderRes.data;
            const items = fullOrder?.orderDetails || fullOrder?.OrderDetails || [];

            setSelectedOrder({
                ...order,
                ...fullOrder,
                items: Array.isArray(items) ? items : []
            });
            setShowDetailModal(true);
        } catch (err) {
            console.error('❌ Lỗi tải chi tiết đơn hàng:', err);
            setSelectedOrder(order);
            setShowDetailModal(true);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchSearch =
            String(order.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchStatus = statusFilter === 'Tất cả' ||
            order.status?.toUpperCase() === statusFilter.toUpperCase();

        return matchSearch && matchStatus;
    });

    const stats = {
        total: orders.length,
        completed: orders.filter(o => o.status?.toUpperCase() === 'COMPLETED').length,
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Quản Lý Đơn Hàng</h1>
                    <p className="text-gray-400">Theo dõi và xử lý đơn hàng của khách</p>
                </div>
                <button
                    onClick={fetchOrders}
                    disabled={loading}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Đang tải...' : 'Làm mới'}
                </button>
            </div>

            {/* Stats */}
            {/* <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Tổng đơn</div>
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="text-green-400 text-sm mb-1">Hoàn thành</div>
                    <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
                </div>
            </div> */}

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm mã đơn, tên khách, ghi chú..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 text-white pl-12 pr-4 py-3 rounded-lg border border-gray-700 focus:border-amber-500 outline-none"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-900">
                            <tr>
                                <th className="px-6 py-4 text-left text-white font-semibold">Mã đơn</th>
                                <th className="px-6 py-4 text-left text-white font-semibold">Bàn</th>
                                <th className="px-6 py-4 text-left text-white font-semibold">Khách hàng</th>
                                <th className="px-6 py-4 text-left text-white font-semibold">Ngày giờ</th>
                                <th className="px-6 py-4 text-left text-white font-semibold">Tổng tiền</th>
                                <th className="px-6 py-4 text-left text-white font-semibold">Trạng thái</th>
                                <th className="px-6 py-4 text-center text-white font-semibold">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-gray-400">Đang tải dữ liệu...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Package className="w-16 h-16 text-gray-600" />
                                            <p className="text-gray-400">
                                                {orders.length === 0
                                                    ? '🔍 Chưa có đơn hàng nào trong hệ thống'
                                                    : 'Không tìm thấy đơn hàng phù hợp'}
                                            </p>
                                            {orders.length === 0 && (
                                                <p className="text-gray-500 text-sm">
                                                    Đơn hàng sẽ xuất hiện khi nhân viên tạo đơn từ POS
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 text-amber-400 font-bold">#{order.id}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-white font-medium">
                                                Bàn {order.table?.number || order.tableId || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-white font-medium">
                                                {order.customerName || 'Khách lẻ'}
                                            </div>
                                            {order.notes && (
                                                <div className="text-gray-400 text-sm truncate max-w-xs">
                                                    {order.notes}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-white">
                                                {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                            </div>
                                            <div className="text-gray-400 text-sm">
                                                {new Date(order.createdAt).toLocaleTimeString('vi-VN')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-amber-500 font-bold">
                                            {(order.totalAmount || 0).toLocaleString('vi-VN')}đ
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)} {getStatusText(order.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => viewOrderDetail(order)}
                                                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteOrder(order.id)}
                                                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                                    title="Xóa đơn hàng"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">Chi Tiết Đơn Hàng #{selectedOrder.id}</h2>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="text-gray-400 hover:text-white text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Order Info */}
                            <div>
                                <h3 className="text-white font-bold mb-3">Thông Tin Đơn Hàng</h3>
                                <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Mã đơn:</span>
                                        <span className="text-amber-400 font-bold">#{selectedOrder.id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Bàn:</span>
                                        <span className="text-white font-medium">
                                            Bàn {selectedOrder.table?.number || selectedOrder.tableId}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Khách hàng:</span>
                                        <span className="text-white font-medium">
                                            {selectedOrder.customerName || 'Khách lẻ'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Ngày giờ:</span>
                                        <span className="text-white font-medium">
                                            {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Trạng thái:</span>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedOrder.status)}`}>
                                            {getStatusIcon(selectedOrder.status)} {getStatusText(selectedOrder.status)}
                                        </span>
                                    </div>
                                    {selectedOrder.notes && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Ghi chú:</span>
                                            <span className="text-white font-medium text-right max-w-xs">
                                                {selectedOrder.notes}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h3 className="text-white font-bold mb-3">Sản Phẩm Đã Đặt</h3>
                                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedOrder.items.map((item, index) => (
                                            <div key={index} className="bg-gray-900 rounded-lg p-4 flex justify-between items-center">
                                                <div>
                                                    <div className="text-white font-medium">
                                                        {item.productName || item.product?.name || 'N/A'}
                                                    </div>
                                                    <div className="text-gray-400 text-sm">
                                                        {(item.price || 0).toLocaleString('vi-VN')}đ × {item.quantity || 0}
                                                    </div>
                                                </div>
                                                <div className="text-amber-500 font-bold text-lg">
                                                    {((item.price || 0) * (item.quantity || 0)).toLocaleString('vi-VN')}đ
                                                </div>
                                            </div>
                                        ))}
                                        <div className="bg-amber-600 rounded-lg p-4 flex justify-between items-center">
                                            <span className="text-white font-bold text-lg">Tổng cộng:</span>
                                            <span className="text-white font-bold text-2xl">
                                                {(selectedOrder.totalAmount || 0).toLocaleString('vi-VN')}đ
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-900 rounded-lg p-8 text-center text-gray-400">
                                        Không có thông tin sản phẩm
                                    </div>
                                )}
                            </div>

                            {/* Update Status */}
                            <div>
                                <h3 className="text-white font-bold mb-3">Cập Nhật Trạng Thái</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        onClick={() => updateOrderStatus(selectedOrder.id, 'COMPLETED')}
                                        disabled={selectedOrder.status === 'COMPLETED'}
                                        className={`px-4 py-3 rounded-lg font-medium transition-colors ${selectedOrder.status === 'COMPLETED'
                                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            : 'bg-gray-900 text-white hover:bg-gray-700'
                                            }`}
                                    >
                                        {getStatusIcon('COMPLETED')}
                                        <span className="ml-2">{getStatusText('COMPLETED')}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminOrders;