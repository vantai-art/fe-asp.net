import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, X, Upload, Link } from 'lucide-react';

function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [previewImage, setPreviewImage] = useState('');
    const imageInputRef = useRef(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock: '',
        image: '',
        categoryId: ''
    });

    // 🟢 Lấy danh sách sản phẩm
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const token = localStorage.getItem('admin_token');
                const res = await fetch('https://chuyen-de-asp.onrender.com/api/food', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!res.ok) throw new Error('Không thể tải danh sách sản phẩm');
                const data = await res.json();
                setProducts(data);
            } catch (err) {
                console.error('Lỗi khi tải sản phẩm:', err);
                setError('Không thể tải sản phẩm từ server');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // 🟡 Lấy danh sách danh mục
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const token = localStorage.getItem('admin_token');
                const res = await fetch('https://chuyen-de-asp.onrender.com/api/category', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data);
                }
            } catch (err) {
                console.error('Lỗi khi tải danh mục:', err);
            }
        };
        fetchCategories();
    }, []);

    // 🟢 Mở modal thêm/sửa
    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                stock: product.stockQuantity,
                image: product.imageUrl || '',
                categoryId: product.category?.id || ''
            });
            setPreviewImage(product.imageUrl || '');
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                stock: '',
                image: '',
                categoryId: ''
            });
            setPreviewImage('');
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProduct(null);
        setPreviewImage('');
    };

    // 🔹 Upload ảnh từ file - Convert sang Base64
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Kiểm tra kích thước file (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert("Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 5MB");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                setPreviewImage(base64String);
                setFormData({ ...formData, image: base64String });
            };
            reader.readAsDataURL(file);
        }
    };

    // 🔹 Nhập URL ảnh
    const handleImageURLChange = (e) => {
        const url = e.target.value;
        setFormData({ ...formData, image: url });
        setPreviewImage(url);
    };

    // 🔹 Dán ảnh từ clipboard
    const handlePaste = async (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            // Kiểm tra nếu là hình ảnh
            if (item.type.indexOf('image') !== -1) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    const localURL = URL.createObjectURL(file);
                    setPreviewImage(localURL);
                    setFormData({ ...formData, image: localURL });
                }
                break;
            }

            // Kiểm tra nếu là text (có thể là URL)
            if (item.type === 'text/plain') {
                item.getAsString((text) => {
                    // Kiểm tra xem có phải URL hình ảnh không
                    if (text.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i) ||
                        text.match(/^https?:\/\//)) {
                        setFormData({ ...formData, image: text });
                        setPreviewImage(text);
                    }
                });
            }
        }
    };

    // 🟢 Thêm / Cập nhật sản phẩm
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.categoryId) {
            alert("Vui lòng chọn danh mục trước khi lưu sản phẩm!");
            return;
        }

        const token = localStorage.getItem('admin_token');
        const method = editingProduct ? 'PUT' : 'POST';
        const url = editingProduct
            ? `https://chuyen-de-asp.onrender.com/api/food/${editingProduct.id}`
            : 'https://chuyen-de-asp.onrender.com/api/food';

        const payload = {
            name: formData.name,
            description: formData.description,
            price: Number(formData.price),
            stockQuantity: Number(formData.stock),
            imageUrl: formData.image,
            categoryId: Number(formData.categoryId)
        };

        console.log('📦 Payload gửi đi:', payload);

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("⚠️ Lỗi backend:", errorText);
                alert(`Lỗi: ${errorText}`);
                throw new Error('Không thể lưu sản phẩm');
            }

            const updated = await res.json();
            console.log('✅ Lưu thành công:', updated);

            // Reload lại danh sách
            const refreshRes = await fetch('https://chuyen-de-asp.onrender.com/api/food', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (refreshRes.ok) {
                const allProducts = await refreshRes.json();
                setProducts(allProducts);
            }

            handleCloseModal();
            alert('✅ Lưu sản phẩm thành công!');
        } catch (err) {
            console.error('❌ Lỗi khi lưu sản phẩm:', err);
        }
    };

    // 🗑️ Xóa sản phẩm
    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`https://chuyen-de-asp.onrender.com/api/food/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setProducts(products.filter(p => p.id !== id));
                alert('✅ Xóa sản phẩm thành công!');
            } else {
                alert('❌ Không thể xóa sản phẩm!');
            }
        } catch (err) {
            console.error('Lỗi khi xóa sản phẩm:', err);
            alert('❌ Lỗi khi xóa sản phẩm!');
        }
    };

    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-6 text-gray-400">Đang tải dữ liệu sản phẩm...</div>;
    if (error) return <div className="p-6 text-red-500">{error}</div>;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Quản Lý Sản Phẩm</h1>
                <p className="text-gray-400">Quản lý danh sách sản phẩm của cửa hàng</p>
            </div>

            {/* Tìm kiếm + Thêm */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm sản phẩm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 text-white pl-12 pr-4 py-3 rounded-lg border border-gray-700 focus:border-amber-500 outline-none"
                    />
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 whitespace-nowrap"
                >
                    <Plus className="w-5 h-5" />
                    Thêm Sản Phẩm
                </button>
            </div>

            {/* Danh sách sản phẩm */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                        <div key={product.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-amber-500 transition-colors">
                            <img
                                src={product.imageUrl || 'https://via.placeholder.com/400'}
                                alt={product.name}
                                className="w-full h-56 object-cover"
                            />
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-white font-bold text-lg">{product.name}</h3>
                                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded">
                                        {product.category?.name || 'Khác'}
                                    </span>
                                </div>
                                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.description}</p>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-amber-500 font-bold text-xl">
                                        {(product.price || 0).toLocaleString('vi-VN')}đ
                                    </span>
                                    <span className="text-gray-400 text-sm">
                                        Kho: <span className="text-white font-semibold">{product.stockQuantity || 0}</span>
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(product)}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded flex items-center justify-center gap-2"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center text-gray-400 py-12">
                        Không có sản phẩm nào
                    </div>
                )}
            </div>

            {/* Modal thêm / sửa */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white">
                                {editingProduct ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Tên */}
                            <div>
                                <label className="block text-white mb-2 font-medium">Tên Sản Phẩm *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-gray-700 text-white px-4 py-3 rounded border border-gray-600 focus:border-amber-500 outline-none"
                                    placeholder="Nhập tên sản phẩm"
                                />
                            </div>

                            {/* Mô tả */}
                            <div>
                                <label className="block text-white mb-2 font-medium">Mô Tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-gray-700 text-white px-4 py-3 rounded border border-gray-600 focus:border-amber-500 outline-none"
                                    rows={3}
                                    placeholder="Mô tả sản phẩm"
                                />
                            </div>

                            {/* Giá + Kho */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-white mb-2 font-medium">Giá (VNĐ) *</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full bg-gray-700 text-white px-4 py-3 rounded border border-gray-600 focus:border-amber-500 outline-none"
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-white mb-2 font-medium">Số Lượng Kho *</label>
                                    <input
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        className="w-full bg-gray-700 text-white px-4 py-3 rounded border border-gray-600 focus:border-amber-500 outline-none"
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                            </div>

                            {/* Danh mục */}
                            <div>
                                <label className="block text-white mb-2 font-medium">Danh Mục *</label>
                                <select
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                    className="w-full bg-gray-700 text-white px-4 py-3 rounded border border-gray-600 focus:border-amber-500 outline-none"
                                >
                                    <option value="">-- Chọn danh mục --</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Hình ảnh - Hỗ trợ dán */}
                            <div>
                                <label className="block text-white mb-2 font-medium">
                                    Hình Ảnh Sản Phẩm *
                                    <span className="text-gray-400 text-sm ml-2">(Hỗ trợ dán Ctrl+V)</span>
                                </label>

                                {/* Preview ảnh */}
                                {previewImage && (
                                    <div className="relative mb-3">
                                        <img
                                            src={previewImage}
                                            alt="Preview"
                                            className="w-full h-56 object-cover rounded border border-gray-600"
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/400?text=Invalid+Image';
                                            }}
                                        />
                                        <button
                                            onClick={() => {
                                                setPreviewImage("");
                                                setFormData({ ...formData, image: "" });
                                            }}
                                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {/* Khu vực dán ảnh */}
                                <div
                                    onPaste={handlePaste}
                                    className="border-2 border-dashed border-gray-600 rounded-lg p-6 mb-3 bg-gray-700/50 hover:border-amber-500 transition-colors cursor-pointer"
                                    onClick={() => imageInputRef.current?.click()}
                                >
                                    <div className="text-center">
                                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-white font-medium mb-1">
                                            Nhấp để chọn hoặc kéo thả ảnh
                                        </p>
                                        <p className="text-gray-400 text-sm">
                                            Hoặc nhấn <kbd className="bg-gray-600 px-2 py-1 rounded">Ctrl+V</kbd> để dán ảnh
                                        </p>
                                    </div>
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        className="hidden"
                                    />
                                </div>

                                {/* Hoặc nhập URL */}
                                <div className="relative">
                                    <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Hoặc dán URL ảnh từ web..."
                                        value={formData.image}
                                        onChange={handleImageURLChange}
                                        onPaste={handlePaste}
                                        className="w-full bg-gray-700 text-white pl-10 pr-4 py-3 rounded border border-gray-600 focus:border-amber-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Nút hành động */}
                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded font-semibold"
                                >
                                    {editingProduct ? 'Cập Nhật' : 'Thêm Mới'}
                                </button>
                                <button
                                    onClick={handleCloseModal}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded font-semibold"
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminProducts;