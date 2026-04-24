// pages/MenuPage.jsx
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Star, Filter, Package } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import Footer from '../components/Footer';

function MenuPage() {
    const { products, addToCart, loading, error } = useAppContext();
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showFilters, setShowFilters] = useState(true);

    // Lấy danh mục từ API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('https://chuyen-de-asp.onrender.com/api/category');
                if (res.ok) {
                    const data = await res.json();
                    console.log('Danh mục từ API:', data);
                    setCategories(data);
                }
            } catch (err) {
                console.error('Lỗi tải danh mục:', err);
            }
        };
        fetchCategories();
    }, []);

    // Lọc sản phẩm theo danh mục
    const filteredProducts = () => {
        if (selectedCategory === null) {
            return []; // Chưa chọn = không hiển thị
        } else if (selectedCategory === 'all') {
            return products; // "Tất cả" = hiển thị tất cả sản phẩm
        } else {
            return products.filter(p => p.category?.name === selectedCategory);
        }
    };

    const displayProducts = filteredProducts();

    // Xử lý thêm giỏ hàng
    const handleAddToCart = (product) => {
        addToCart(product);

        const note = document.createElement('div');
        note.className = 'fixed top-20 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
        note.textContent = `✅ Đã thêm "${product.name}" vào giỏ hàng!`;
        document.body.appendChild(note);

        setTimeout(() => note.remove(), 3000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 pt-20">
            {/* Hero */}
            <div
                className="relative h-80 flex items-center justify-center text-white mb-12"
                style={{
                    backgroundImage: 'url(https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&h=600&fit=crop)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="absolute inset-0 bg-black/60"></div>
                <div className="relative text-center z-10 px-4">
                    <h1 className="text-5xl md:text-6xl font-bold mb-4">THỰC ĐƠN</h1>
                    <p className="text-xl text-amber-100">Khám phá những món ăn & thức uống đặc sắc</p>
                </div>
            </div>

            {/* Nội dung chính */}
            <div className="container mx-auto px-4 py-12">
                {/* Nút Toggle Bộ Lọc */}
                <div className="flex justify-center mb-8">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all"
                    >
                        <Filter className="w-5 h-5" />
                        {showFilters ? 'Ẩn Danh Mục' : 'Hiện Danh Mục'}
                    </button>
                </div>

                {/* Categories - Hiển thị đẹp với hình ảnh */}
                {showFilters && (
                    <div className="mb-12 animate-fade-in">
                        <h2 className="text-2xl font-bold text-white mb-6 text-center">DANH MỤC SẢN PHẨM</h2>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {/* Nút Tất Cả */}
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`relative overflow-hidden rounded-lg transition-all transform hover:scale-105 ${selectedCategory === 'all'
                                        ? 'ring-4 ring-amber-500'
                                        : 'hover:ring-2 hover:ring-amber-400'
                                    }`}
                            >
                                <div className="h-32 flex items-center justify-center bg-gradient-to-br from-amber-600 to-amber-800">
                                    <Package className="w-12 h-12 text-white" />
                                </div>
                                <div className="bg-gray-800 p-3 text-center">
                                    <span className="text-white font-semibold">Tất Cả</span>
                                </div>
                            </button>

                            {/* Các danh mục từ API */}
                            {categories && categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.name)}
                                    className={`relative overflow-hidden rounded-lg transition-all transform hover:scale-105 ${selectedCategory === cat.name
                                            ? 'ring-4 ring-amber-500'
                                            : 'hover:ring-2 hover:ring-amber-400'
                                        }`}
                                >
                                    <div
                                        className="h-32 flex items-center justify-center"
                                        style={{ backgroundColor: cat.color || '#374151' }}
                                    >
                                        {cat.imageUrl ? (
                                            <img
                                                src={cat.imageUrl}
                                                alt={cat.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Package className="w-12 h-12 text-white/80" />
                                        )}
                                    </div>
                                    <div className="bg-gray-800 p-3 text-center">
                                        <span className="text-white font-semibold">{cat.name}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Hiển thị danh mục đang chọn */}
                <div className="text-center mb-8">
                    {selectedCategory === null ? (
                        <h3 className="text-xl text-gray-400">
                            Vui lòng chọn một danh mục để xem sản phẩm
                        </h3>
                    ) : (
                        <h3 className="text-xl text-gray-300">
                            Đang xem: <span className="text-amber-500 font-bold text-2xl">
                                {selectedCategory === 'all' ? 'Tất cả' : selectedCategory}
                            </span>
                        </h3>
                    )}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="text-center py-16 text-gray-400 text-xl">
                        <div className="animate-spin h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        Đang tải sản phẩm...
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-900 text-red-100 p-6 rounded-lg mb-8 text-center">
                        <p className="text-xl font-bold mb-2">Lỗi tải sản phẩm</p>
                        <p>{error}</p>
                    </div>
                )}

                {/* Products Grid */}
                {!loading && !error && (
                    <>
                        {selectedCategory === null ? (
                            <div className="text-center py-16 text-gray-400">
                                <Package className="w-16 h-16 mx-auto mb-3 text-gray-600" />
                                <p className="text-xl">Hãy chọn một danh mục để xem sản phẩm</p>
                            </div>
                        ) : displayProducts.length === 0 ? (
                            <div className="text-center py-16 text-gray-400">
                                <Package className="w-16 h-16 mx-auto mb-3 text-gray-600" />
                                <p className="text-xl">Không có sản phẩm nào trong danh mục này</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {displayProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-amber-500 transition-all transform hover:scale-105"
                                    >
                                        {/* Image */}
                                        <div className="relative h-56 overflow-hidden bg-gray-800 group">
                                            <img
                                                src={product.imageUrl || 'data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%231f2937'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-size='16'%3EKhông có ảnh%3C/text%3E%3C/svg%3E'}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%231f2937'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-size='16'%3EKhông có ảnh%3C/text%3E%3C/svg%3E';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 flex items-center justify-center transition-all">
                                                <button
                                                    onClick={() => handleAddToCart(product)}
                                                    className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                                                >
                                                    <ShoppingCart className="w-5 h-5" />
                                                    Thêm Vào Giỏ
                                                </button>
                                            </div>
                                            <span className="absolute top-3 right-3 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                                {product.category?.name || 'Khác'}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="p-5">
                                            <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">
                                                {product.name}
                                            </h3>
                                            <p className="text-gray-400 text-sm mb-3 line-clamp-2 h-10">
                                                {product.description || 'Chưa có mô tả'}
                                            </p>

                                            {/* Rating */}
                                            <div className="flex items-center gap-1 mb-3">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={`w-4 h-4 ${star <= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'
                                                            }`}
                                                    />
                                                ))}
                                                <span className="text-gray-400 text-sm ml-1">(4.8)</span>
                                            </div>

                                            {/* Price & Cart */}
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                                                <span className="text-amber-500 font-bold text-xl">
                                                    {(product.price || 0).toLocaleString('vi-VN')}đ
                                                </span>
                                                <button
                                                    onClick={() => handleAddToCart(product)}
                                                    className="bg-gray-800 hover:bg-amber-600 text-white p-3 rounded-lg transition-colors group"
                                                    title="Thêm vào giỏ hàng"
                                                >
                                                    <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            <Footer />

            {/* Animations */}
            <style>{`
                @keyframes slide-in {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}

export default MenuPage;