import React from 'react';
import { ShoppingCart, Star } from 'lucide-react';

function ProductCard({ product, onAddToCart }) {
    return (
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-amber-500 transition-all hover:transform hover:scale-105 duration-300">
            {/* Hình Ảnh Sản Phẩm */}
            <div className="relative overflow-hidden group">
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                    <button
                        onClick={() => onAddToCart && onAddToCart(product)}
                        className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        Thêm Vào Giỏ
                    </button>
                </div>
                {/* Badge Danh Mục */}
                <span className="absolute top-3 right-3 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    {product.category}
                </span>
            </div>

            {/* Thông Tin Sản Phẩm */}
            <div className="p-5">
                <h3 className="text-white font-bold text-xl mb-2 hover:text-amber-500 transition-colors cursor-pointer">
                    {product.name}
                </h3>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {product.description}
                </p>

                {/* Đánh Giá */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`w-4 h-4 ${star <= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
                            />
                        ))}
                    </div>
                    <span className="text-gray-400 text-sm">(4.8)</span>
                </div>

                {/* Giá & Nút Mua */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                    <div>
                        <div className="text-amber-500 font-bold text-2xl">
                            {product.price.toLocaleString('vi-VN')}đ
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                            Đã bao gồm VAT
                        </div>
                    </div>
                    <button
                        onClick={() => onAddToCart && onAddToCart(product)}
                        className="bg-gray-800 hover:bg-amber-600 text-white p-3 rounded-lg transition-colors group"
                        title="Thêm vào giỏ hàng"
                    >
                        <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductCard;