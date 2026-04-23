// src/components/CartSidebar.jsx - Chỉ giữ chức năng giỏ hàng
import React from 'react';
import { X, ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

function CartSidebar({ onClose }) {
    const { cart, cartTotal, removeFromCart, updateQuantity, clearCart } = useAppContext();

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            ></div>

            {/* Sidebar */}
            <div className="relative bg-white w-full max-w-md h-full overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">Giỏ Hàng</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Empty Cart */}
                    {cart.length === 0 ? (
                        <div className="text-center py-12">
                            <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">Giỏ hàng trống</p>
                        </div>
                    ) : (
                        /* ==================== CART ITEMS ==================== */
                        <>
                            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                                {cart.map(item => (
                                    <div key={item.id} className="flex gap-4 border-b pb-4">
                                        <img
                                            src={item.imageUrl || item.image || 'https://via.placeholder.com/80'}
                                            alt={item.name}
                                            className="w-20 h-20 object-cover rounded"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{item.name}</h3>
                                            <p className="text-amber-600 font-bold">
                                                {item.price.toLocaleString('vi-VN')}đ
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center transition-colors"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="w-12 text-center font-semibold">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="ml-auto text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex items-center justify-between text-xl font-bold mb-4">
                                    <span>Tổng cộng:</span>
                                    <span className="text-amber-600">
                                        {cartTotal.toLocaleString('vi-VN')}đ
                                    </span>
                                </div>
                                <button
                                    onClick={clearCart}
                                    className="w-full border border-red-500 text-red-500 py-3 rounded hover:bg-red-50 transition-colors font-semibold"
                                >
                                    Xóa Giỏ Hàng
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CartSidebar;