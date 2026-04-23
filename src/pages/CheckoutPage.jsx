// src/pages/CheckoutPage.jsx
// ============================================
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import Footer from '../components/Footer';

function CheckoutPage() {
    const { cart = [], cartTotal, createOrder, tables = [] } = useAppContext();
    const [selectedTable, setSelectedTable] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        if (!selectedTable) {
            alert('Vui lòng chọn bàn!');
            return;
        }

        setLoading(true);
        try {
            await createOrder(selectedTable);
            // Reset form
            setSelectedTable(null);
        } catch (error) {
            console.error('Checkout error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-black pt-20 pb-12">
                <div className="container mx-auto px-4 text-center py-20">
                    <h1 className="text-white text-3xl font-bold mb-4">Giỏ hàng trống</h1>
                    <a href="/shop" className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg">
                        Tiếp tục mua sắm
                    </a>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black pt-20 pb-12">
            <div className="container mx-auto px-4">
                <h1 className="text-white text-4xl font-bold mb-8">Thanh Toán</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Order Info */}
                    <div className="lg:col-span-2">
                        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 mb-6">
                            <h2 className="text-white text-xl font-bold mb-4">Chọn Bàn</h2>
                            <div className="grid grid-cols-3 gap-4">
                                {Array.isArray(tables) && tables.map(table => (
                                    <button
                                        key={table.id}
                                        onClick={() => setSelectedTable(table.id)}
                                        className={`p-4 rounded-lg font-bold text-center transition-all ${selectedTable === table.id
                                                ? 'bg-amber-600 text-white'
                                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                            }`}
                                        disabled={table.status === 'OCCUPIED'}
                                    >
                                        Bàn {table.tableNumber}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                            <h2 className="text-white text-xl font-bold mb-4">Chi Tiết Đơn Hàng</h2>
                            <div className="space-y-3">
                                {Array.isArray(cart) && cart.map(item => (
                                    <div key={item.id} className="flex justify-between text-gray-300 pb-3 border-b border-gray-700">
                                        <div>
                                            <p className="text-white font-medium">{item.name}</p>
                                            <p className="text-sm">x {item.quantity}</p>
                                        </div>
                                        <p className="text-amber-500 font-bold">
                                            {(item.price * item.quantity)?.toLocaleString('vi-VN')}đ
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 h-fit">
                        <h2 className="text-white text-xl font-bold mb-4">Tóm Tắt Đơn Hàng</h2>
                        <div className="space-y-3 mb-6 pb-6 border-b border-gray-700">
                            <div className="flex justify-between text-gray-300">
                                <span>Tạm tính:</span>
                                <span>{cartTotal?.toLocaleString('vi-VN')}đ</span>
                            </div>
                        </div>

                        <div className="flex justify-between text-white font-bold text-lg mb-6">
                            <span>Tổng cộng:</span>
                            <span className="text-amber-500">{cartTotal?.toLocaleString('vi-VN')}đ</span>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={loading || !selectedTable}
                            className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-3 rounded-lg font-bold"
                        >
                            {loading ? '⏳ Đang xử lý...' : '✓ Xác Nhận Đơn Hàng'}
                        </button>

                        <a href="/cart" className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-bold text-center block mt-3">
                            Quay Lại
                        </a>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default CheckoutPage;