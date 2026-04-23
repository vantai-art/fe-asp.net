// src/pages/UserOrdersPage.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowLeft, Download, RefreshCw } from 'lucide-react';

function UserOrdersPage() {
    const { axiosInstance } = useAppContext();
    const navigate = useNavigate();
    const [myOrders, setMyOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exportingOrderId, setExportingOrderId] = useState(null);

    // ✅ Kiểm tra đăng nhập
    const userToken = localStorage.getItem('user_token');
    const user = JSON.parse(localStorage.getItem('user_user') || '{}');

    // ✅ Load orders
    const loadOrders = async () => {
        if (!userToken) {
            navigate('/auth');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('🔄 Loading user orders...');

            const res = await axiosInstance.get('/order');
            const data = res.data?.data || res.data;
            const orders = Array.isArray(data) ? data : [];

            console.log('✅ Orders loaded:', orders.length);
            setMyOrders(orders);

        } catch (err) {
            console.error('❌ Error loading orders:', err);

            if (err.response?.status === 401) {
                localStorage.removeItem('user_token');
                localStorage.removeItem('user_user');
                navigate('/auth');
            } else {
                setError('Không thể tải đơn hàng của bạn');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    // ✅ Xuất bill CSV
    const exportBill = async (order) => {
        setExportingOrderId(order.id);

        try {
            console.log('📥 Exporting bill for order:', order.id);

            // Lấy chi tiết order items
            // BE mới: orderDetails bên trong GET /order/{id}
            const res = await axiosInstance.get(`/order/${order.id}`);
            const data = res.data?.data || res.data;
            const orderItems = Array.isArray(data) ? data : [];

            if (orderItems.length === 0) {
                alert('⚠️ Đơn hàng không có sản phẩm');
                return;
            }

            // Tạo CSV content
            let csv = "data:text/csv;charset=utf-8,\uFEFF";
            csv += "HOA DON COFFEE BLEND\n";
            csv += "================================\n";
            csv += `Ma don hang,${order.id}\n`;
            csv += `Ngay tao,${formatDate(order.createdAt)}\n`;
            csv += `Khach hang,${order.customerName || user.username || 'Khach hang'}\n`;
            csv += `Ban,${order.tableId ? 'Ban ' + order.tableId : 'Truc tuyen'}\n`;
            csv += `Trang thai,${getStatusLabel(order.status).label}\n\n`;
            csv += "STT,Ten mon,So luong,Don gia,Thanh tien\n";

            let total = 0;
            orderItems.forEach((item, i) => {
                const productName = item.productName || item.product?.name || "N/A";
                const quantity = item.quantity || 0;
                const price = item.price || 0;
                const amount = quantity * price;
                total += amount;

                csv += `${i + 1},"${productName}",${quantity},${price.toLocaleString("vi-VN")},${amount.toLocaleString("vi-VN")}\n`;
            });

            csv += `\nTONG CONG,,,${total.toLocaleString("vi-VN")} VND\n`;
            csv += "\nCam on quy khach!\n";
            csv += "COFFEE BLEND - Cafe & Restaurant";

            // Download file
            const uri = encodeURI(csv);
            const link = document.createElement("a");
            link.href = uri;
            link.download = `HoaDon_${order.id}_${new Date().getTime()}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('✅ Bill exported successfully');
            alert('✅ Đã tải hóa đơn xuống máy!');

        } catch (err) {
            console.error('❌ Error exporting bill:', err);
            alert('❌ Không thể xuất hóa đơn: ' + (err.message || 'Lỗi không xác định'));
        } finally {
            setExportingOrderId(null);
        }
    };

    // ✅ Helpers
    const getStatusLabel = (status) => {
        const statusMap = {
            PENDING: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800' },
            CONFIRMED: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
            PREPARING: { label: 'Đang chuẩn bị', color: 'bg-purple-100 text-purple-800' },
            SERVED: { label: 'Đã phục vụ', color: 'bg-green-100 text-green-800' },
            PAID: { label: 'Đã thanh toán', color: 'bg-gray-100 text-gray-800' },
            CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
        };
        return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'N/A';
        }
    };

    // ✅ Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải đơn hàng...</p>
                </div>
            </div>
        );
    }

    // ✅ Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-red-600 mb-4">{error}</p>
                    <button
                        onClick={loadOrders}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    // ✅ Main render
    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <ClipboardList className="w-8 h-8 text-amber-600" />
                                Đơn hàng của tôi
                            </h1>
                            <p className="mt-2 text-gray-600">
                                Tổng cộng: {myOrders.length} đơn hàng
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={loadOrders}
                        disabled={loading}
                        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>
                </div>

                {/* Orders List */}
                {myOrders.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <ClipboardList className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Chưa có đơn hàng nào
                        </h3>
                        <p className="text-gray-500 mb-6">
                            Bạn chưa đặt đơn hàng nào. Hãy khám phá menu của chúng tôi!
                        </p>
                        <button
                            onClick={() => navigate('/shop')}
                            className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg transition"
                        >
                            Xem Cửa Hàng
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {myOrders.map((order) => {
                            const statusInfo = getStatusLabel(order.status);
                            const isExporting = exportingOrderId === order.id;

                            return (
                                <div
                                    key={order.id}
                                    className="bg-white rounded-lg shadow hover:shadow-md transition"
                                >
                                    {/* Order Header */}
                                    <div className="p-6 border-b border-gray-200">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Đơn hàng #{order.id}
                                                </h3>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    {order.tableId ? `Bàn ${order.tableId}` : 'Đơn trực tuyến'} • {formatDate(order.createdAt)}
                                                </p>
                                            </div>
                                            <span
                                                className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}
                                            >
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Order Details */}
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Tổng tiền</p>
                                                <p className="text-2xl font-bold text-amber-600">
                                                    {formatPrice(order.totalAmount)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => exportBill(order)}
                                                disabled={isExporting}
                                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition"
                                            >
                                                {isExporting ? (
                                                    <>
                                                        <Download className="w-5 h-5 animate-bounce" />
                                                        <span>Đang xuất...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download className="w-5 h-5" />
                                                        <span>Xuất hóa đơn</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {order.customerName && (
                                            <div className="mb-2">
                                                <p className="text-sm text-gray-600">
                                                    <span className="font-medium">Khách hàng:</span> {order.customerName}
                                                </p>
                                            </div>
                                        )}

                                        {order.notes && (
                                            <div className="mt-4 p-3 bg-gray-50 rounded">
                                                <p className="text-sm text-gray-600">
                                                    <span className="font-medium">Ghi chú:</span> {order.notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserOrdersPage;