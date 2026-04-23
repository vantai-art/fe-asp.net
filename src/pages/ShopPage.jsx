// src/pages/ShopPage.jsx
import React, { useState, useMemo } from 'react';
import {
    ShoppingCart,
    Search,
    Package,
    Home,
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import CartSidebar from '../components/CartSidebar';

function ShopPage() {
    const {
        products,
        tables,
        cart,
        addToCart,
        loading,
        error,
    } = useAppContext();

    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('default');
    const [showCartSidebar, setShowCartSidebar] = useState(false);

    // ===== THÊM VÀO GIỎ =====
    const handleAddToCart = (product) => {
        addToCart(product);

        const notification = document.createElement('div');
        notification.className =
            'fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
        notification.textContent = `✅ Đã thêm "${product.name}" vào giỏ hàng!`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2500);

        // Tự động mở giỏ hàng sau khi thêm
        setShowCartSidebar(true);
    };

    // ===== LỌC + SẮP XẾP =====
    const filteredProducts = useMemo(() => {
        let result = products.filter((product) => {
            const matchSearch = product.name
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase());
            return matchSearch;
        });

        if (sortBy === 'price-asc')
            result.sort((a, b) => (a.price || 0) - (b.price || 0));
        else if (sortBy === 'price-desc')
            result.sort((a, b) => (b.price || 0) - (a.price || 0));

        return result;
    }, [products, searchTerm, sortBy]);

    // ===== LỌC BÀN TRỐNG =====
    const freeTables = useMemo(() => {
        return tables.filter((t) => {
            const status = t.status?.toUpperCase();
            return status === 'FREE' || status === 'AVAILABLE' || status === 'EMPTY';
        });
    }, [tables]);

    // ===== RENDER =====
    return (
        <div className="min-h-screen bg-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-900 to-amber-700 py-8 mt-16 shadow-md">
                <div className="container mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ShoppingCart className="w-8 h-8 text-white" />
                        <div>
                            <h1 className="text-3xl font-bold text-white">CỬA HÀNG</h1>
                            <p className="text-amber-100 text-sm">
                                Khám phá những món ăn & thức uống đặc sắc
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Nút giỏ hàng */}
                        <button
                            onClick={() => setShowCartSidebar(true)}
                            className="relative bg-white hover:bg-gray-100 text-amber-700 px-6 py-2 rounded-lg flex items-center gap-2 font-bold transition-colors"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            Giỏ Hàng
                            {cart.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                    {cart.length}
                                </span>
                            )}
                        </button>

                        {/* Trang chủ */}
                        <button
                            onClick={() => navigate('/')}
                            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-bold transition-colors"
                        >
                            <Home className="w-5 h-5" />
                            Trang Chủ
                        </button>
                    </div>
                </div>
            </div>

            {/* Main */}
            <div className="pt-32 pb-16">
                <div className="container mx-auto px-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Thanh công cụ */}
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Ô tìm kiếm */}
                                <div>
                                    <label className="text-white font-semibold mb-3 block">
                                        Tìm Kiếm
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm sản phẩm..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-gray-700 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-600 focus:border-amber-500 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Chọn sắp xếp */}
                                <div>
                                    <label className="text-white font-semibold mb-3 block">
                                        Sắp Xếp
                                    </label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-amber-500 outline-none"
                                    >
                                        <option value="default">Mặc định</option>
                                        <option value="price-asc">Giá: Thấp → Cao</option>
                                        <option value="price-desc">Giá: Cao → Thấp</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Danh sách sản phẩm */}
                        {loading ? (
                            <div className="text-center py-20">
                                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-amber-500 mx-auto mb-4"></div>
                                <p className="text-gray-400 text-lg">Đang tải sản phẩm...</p>
                            </div>
                        ) : error ? (
                            <div className="bg-red-900 text-red-100 p-6 rounded-lg text-center">
                                <p className="text-lg font-bold mb-2">Lỗi kết nối</p>
                                <p>{error}</p>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-20">
                                <Package className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400 text-lg">Không tìm thấy sản phẩm</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {filteredProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-amber-500 transition-all hover:scale-105 shadow-md"
                                    >
                                        <div className="relative h-44 overflow-hidden bg-gray-700 group">
                                            <img
                                                src={product.imageUrl || 'https://placehold.co/400x400/374151/9ca3af?text=No+Image'}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://placehold.co/400x400/374151/9ca3af?text=No+Image';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 flex items-center justify-center transition-all">
                                                <button
                                                    onClick={() => handleAddToCart(product)}
                                                    disabled={!product.stockQuantity}
                                                    className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 text-sm"
                                                >
                                                    <ShoppingCart className="w-4 h-4" />
                                                    {product.stockQuantity > 0 ? 'Thêm' : 'Hết'}
                                                </button>
                                            </div>
                                            <span className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                                {product.category?.name || 'Khác'}
                                            </span>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-white font-bold text-sm mb-1 line-clamp-1">
                                                {product.name}
                                            </h3>
                                            <p className="text-gray-400 text-xs mb-2 line-clamp-1">
                                                {product.description}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-amber-400 font-bold text-sm">
                                                    {(product.price || 0).toLocaleString('vi-VN')}đ
                                                </span>
                                                <span className="text-gray-400 text-xs">
                                                    Còn {product.stockQuantity || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cart Sidebar */}
            {showCartSidebar && (
                <CartSidebar
                    onClose={() => setShowCartSidebar(false)}
                    tables={freeTables}
                />
            )}

            <Footer />

            <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}

export default ShopPage;