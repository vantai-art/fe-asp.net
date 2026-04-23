import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit, Trash2, X, Tag, Package, Percent, ChevronDown } from 'lucide-react';
import { promotionAPI, productAPI } from '../../services/api';
import { authAPI } from '../../services/authAPI';

function AdminPromotions() {
    const [activeTab, setActiveTab] = useState('promotions');
    const [promotions, setPromotions] = useState([]);
    const [promotionProducts, setPromotionProducts] = useState([]);
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tất cả');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [loading, setLoading] = useState(true);

    // 🔥 AUTOCOMPLETE STATE
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const productDropdownRef = useRef(null);

    const [formData, setFormData] = useState({
        name: '',
        discountPercentage: '',
        discountAmount: '',
        startDate: '',
        endDate: '',
        isActive: true
    });

    const [ppFormData, setPpFormData] = useState({
        promotionId: '',
        productId: '',
        discountPercent: ''
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    // 🔥 Đóng dropdown khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
                setShowProductDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            if (!authAPI.isAuthenticated()) {
                alert('⚠️ Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                window.location.href = '/admin/login';
                return;
            }

            if (activeTab === 'promotions') {
                const res = await promotionAPI.getAllAdmin();
                setPromotions(res.data);
            } else {
                const [ppRes, proRes, prodRes] = await Promise.all([
                    fetch('https://chuyen-de-asp.onrender.com/api/promotion', {
                        headers: { 'Authorization': `Bearer ${authAPI.getToken()}` }
                    }),
                    promotionAPI.getAllAdmin(),
                    productAPI.getAll()
                ]);

                if (ppRes.ok) {
                    setPromotionProducts(await ppRes.json());
                }
                setPromotions(proRes.data);
                setProducts(prodRes.data);
            }
        } catch (err) {
            console.error('Lỗi khi tải dữ liệu:', err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                alert('❌ Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                authAPI.logout();
                window.location.href = '/admin/login';
            } else {
                alert('❌ Không thể tải dữ liệu');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddPromotion = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null
            };

            if (editingItem) {
                // BE mới không có PUT /promotion/{id} - chỉ có toggle bật/tắt
                // Tạo mới nếu cần thay đổi thông tin
                alert('⚠️ BE mới không hỗ trợ chỉnh sửa khuyến mãi. Hãy xóa và tạo lại.');
                return;
            } else {
                await promotionAPI.create(payload);
            }

            alert(`✅ ${editingItem ? 'Cập nhật' : 'Tạo'} khuyến mãi thành công!`);
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (err) {
            console.error(err);
            alert('❌ Không thể lưu khuyến mãi');
        }
    };

    const handleAddPromotionProduct = async (e) => {
        e.preventDefault();
        try {
            const token = authAPI.getToken();
            const method = editingItem ? 'PUT' : 'POST';
            const url = editingItem
                ? `https://chuyen-de-asp.onrender.com/api/promotion-products/${editingItem.id}`
                : 'https://chuyen-de-asp.onrender.com/api/promotion-products';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(ppFormData)
            });

            if (!res.ok) throw new Error('Không thể lưu sản phẩm khuyến mãi');

            alert(`✅ ${editingItem ? 'Cập nhật' : 'Thêm'} sản phẩm khuyến mãi thành công!`);
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (err) {
            console.error(err);
            alert('❌ ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        const endpoint = activeTab === 'promotions' ? 'promotions' : 'promotion-products';
        if (!window.confirm(`Bạn có chắc muốn xóa ${activeTab === 'promotions' ? 'khuyến mãi' : 'sản phẩm khuyến mãi'} này?`)) return;

        try {
            if (activeTab === 'promotions') {
                await promotionAPI.delete(id);
            } else {
                const token = authAPI.getToken();
                const res = await fetch(`https://chuyen-de-asp.onrender.com/api/promotion-products/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Không thể xóa');
            }

            alert('✅ Đã xóa thành công');
            fetchData();
        } catch (err) {
            console.error(err);
            alert('❌ Không thể xóa');
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        if (activeTab === 'promotions') {
            setFormData({
                name: item.name || '',
                discountPercentage: item.discountPercentage || '',
                discountAmount: item.discountAmount || '',
                startDate: item.startDate ? new Date(item.startDate).toISOString().slice(0, 16) : '',
                endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 16) : '',
                isActive: item.isActive !== false
            });
        } else {
            const selectedProduct = products.find(p => p.id === item.productId);
            setPpFormData({
                promotionId: item.promotionId || '',
                productId: item.productId || '',
                discountPercent: item.discountPercent || ''
            });
            setProductSearchTerm(selectedProduct ? selectedProduct.name : '');
        }
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingItem(null);
        setFormData({
            name: '',
            discountPercentage: '',
            discountAmount: '',
            startDate: '',
            endDate: '',
            isActive: true
        });
        setPpFormData({
            promotionId: '',
            productId: '',
            discountPercent: ''
        });
        setProductSearchTerm('');
    };

    // 🔥 Chọn sản phẩm từ dropdown
    const handleSelectProduct = (product) => {
        setPpFormData({ ...ppFormData, productId: product.id });
        setProductSearchTerm(product.name);
        setShowProductDropdown(false);
    };

    // 🔥 Filter sản phẩm theo search term
    const filteredProductsForDropdown = products.filter(p =>
        p.name.toLowerCase().includes(productSearchTerm.toLowerCase())
    );

    const getPromotionName = (id) => {
        const promo = promotions.find(p => p.id === id);
        return promo ? promo.name : 'N/A';
    };

    const getProductName = (id) => {
        const prod = products.find(p => p.id === id);
        return prod ? prod.name : 'N/A';
    };

    const filteredPromotions = promotions.filter(p => {
        const matchSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'Tất cả' ||
            (statusFilter === 'Hoạt động' && p.isActive) ||
            (statusFilter === 'Không hoạt động' && !p.isActive);
        return matchSearch && matchStatus;
    });

    const filteredPromotionProducts = promotionProducts.filter(pp => {
        const promoName = getPromotionName(pp.promotionId);
        const prodName = getProductName(pp.productId);
        return promoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prodName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const stats = {
        totalPromotions: promotions.length,
        activePromotions: promotions.filter(p => p.isActive).length,
        totalProducts: promotionProducts.length
    };

    if (loading) return <div className="p-6 text-gray-400">Đang tải dữ liệu...</div>;

    return (
        <div className="p-6">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Quản Lý Khuyến Mãi</h1>
                    <p className="text-gray-400">Quản lý chương trình khuyến mãi và sản phẩm giảm giá</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    {activeTab === 'promotions' ? 'Thêm Khuyến Mãi' : 'Thêm Sản Phẩm'}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Tổng khuyến mãi</div>
                    <div className="text-2xl font-bold text-white">{stats.totalPromotions}</div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="text-green-400 text-sm mb-1">Đang hoạt động</div>
                    <div className="text-2xl font-bold text-green-400">{stats.activePromotions}</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                    <div className="text-amber-400 text-sm mb-1">Sản phẩm giảm giá</div>
                    <div className="text-2xl font-bold text-amber-400">{stats.totalProducts}</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('promotions')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${activeTab === 'promotions'
                        ? 'bg-amber-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                >
                    <Tag className="w-5 h-5 inline mr-2" />
                    Khuyến Mãi
                </button>
                <button
                    onClick={() => setActiveTab('products')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${activeTab === 'products'
                        ? 'bg-amber-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                >
                    <Package className="w-5 h-5 inline mr-2" />
                    Sản Phẩm Giảm Giá
                </button>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder={activeTab === 'promotions' ? 'Tìm khuyến mãi...' : 'Tìm sản phẩm...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 text-white pl-12 pr-4 py-3 rounded-lg border border-gray-700 focus:border-amber-500 outline-none"
                    />
                </div>
                {activeTab === 'promotions' && (
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-amber-500 outline-none"
                    >
                        <option value="Tất cả">Tất cả</option>
                        <option value="Hoạt động">Hoạt động</option>
                        <option value="Không hoạt động">Không hoạt động</option>
                    </select>
                )}
            </div>

            {/* Table */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    {activeTab === 'promotions' ? (
                        <table className="w-full">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th className="px-6 py-4 text-left text-white font-semibold">Tên khuyến mãi</th>
                                    <th className="px-6 py-4 text-left text-white font-semibold">Giảm giá</th>
                                    <th className="px-6 py-4 text-left text-white font-semibold">Thời gian</th>
                                    <th className="px-6 py-4 text-left text-white font-semibold">Trạng thái</th>
                                    <th className="px-6 py-4 text-center text-white font-semibold">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {filteredPromotions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                            Không tìm thấy khuyến mãi nào
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPromotions.map((promo) => (
                                        <tr key={promo.id} className="hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Tag className="w-5 h-5 text-amber-500" />
                                                    <div className="text-white font-medium">{promo.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-white">
                                                    {promo.discountPercentage && (
                                                        <div className="flex items-center gap-1 text-green-400">
                                                            <Percent className="w-4 h-4" />
                                                            {promo.discountPercentage}%
                                                        </div>
                                                    )}
                                                    {promo.discountAmount && (
                                                        <div className="text-amber-500">
                                                            -{promo.discountAmount.toLocaleString('vi-VN')}đ
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-300 text-sm">
                                                <div>
                                                    {promo.startDate && new Date(promo.startDate).toLocaleDateString('vi-VN')}
                                                </div>
                                                <div>
                                                    → {promo.endDate && new Date(promo.endDate).toLocaleDateString('vi-VN')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${promo.isActive
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-gray-500/20 text-gray-400'
                                                    }`}>
                                                    {promo.isActive ? 'Hoạt động' : 'Không hoạt động'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(promo)}
                                                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                                        title="Sửa"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(promo.id)}
                                                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                                        title="Xóa"
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
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th className="px-6 py-4 text-left text-white font-semibold">Khuyến mãi</th>
                                    <th className="px-6 py-4 text-left text-white font-semibold">Sản phẩm</th>
                                    <th className="px-6 py-4 text-left text-white font-semibold">Giảm giá</th>
                                    <th className="px-6 py-4 text-center text-white font-semibold">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {filteredPromotionProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                                            Chưa có sản phẩm giảm giá nào
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPromotionProducts.map((pp) => (
                                        <tr key={pp.id} className="hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-amber-400">
                                                    <Tag className="w-4 h-4" />
                                                    {getPromotionName(pp.promotionId)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-white">
                                                    <Package className="w-4 h-4" />
                                                    {getProductName(pp.productId)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 text-green-400 font-bold">
                                                    <Percent className="w-4 h-4" />
                                                    {pp.discountPercent}%
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(pp)}
                                                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                                        title="Sửa"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(pp.id)}
                                                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                                        title="Xóa"
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
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white">
                                {editingItem ? 'Cập Nhật' : 'Thêm'} {activeTab === 'promotions' ? 'Khuyến Mãi' : 'Sản Phẩm'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {activeTab === 'promotions' ? (
                            <form onSubmit={handleAddPromotion} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-white font-medium mb-2">Tên khuyến mãi *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-gray-900 text-white px-4 py-2 rounded border border-gray-700 focus:border-amber-500 outline-none"
                                        placeholder="VD: Giảm giá mùa hè"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-white font-medium mb-2">Giảm % (0-100)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={formData.discountPercentage}
                                            onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                                            className="w-full bg-gray-900 text-white px-4 py-2 rounded border border-gray-700 focus:border-amber-500 outline-none"
                                            placeholder="10"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-white font-medium mb-2">Giảm số tiền (đ)</label>
                                        <input
                                            type="number"
                                            step="1000"
                                            min="0"
                                            value={formData.discountAmount}
                                            onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                                            className="w-full bg-gray-900 text-white px-4 py-2 rounded border border-gray-700 focus:border-amber-500 outline-none"
                                            placeholder="50000"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-white font-medium mb-2">Ngày bắt đầu</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            className="w-full bg-gray-900 text-white px-4 py-2 rounded border border-gray-700 focus:border-amber-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-white font-medium mb-2">Ngày kết thúc</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            className="w-full bg-gray-900 text-white px-4 py-2 rounded border border-gray-700 focus:border-amber-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-5 h-5"
                                    />
                                    <label htmlFor="isActive" className="text-white">Kích hoạt ngay</label>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-medium transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded font-medium transition-colors"
                                    >
                                        {editingItem ? 'Cập nhật' : 'Tạo'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleAddPromotionProduct} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-white font-medium mb-2">Chương trình khuyến mãi *</label>
                                    <select
                                        required
                                        value={ppFormData.promotionId}
                                        onChange={(e) => setPpFormData({ ...ppFormData, promotionId: e.target.value })}
                                        className="w-full bg-gray-900 text-white px-4 py-2 rounded border border-gray-700 focus:border-amber-500 outline-none"
                                    >
                                        <option value="">Chọn khuyến mãi</option>
                                        {promotions.filter(p => p.isActive).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* 🔥 AUTOCOMPLETE PRODUCT SELECTOR */}
                                <div ref={productDropdownRef}>
                                    <label className="block text-white font-medium mb-2">Sản phẩm *</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            required
                                            value={productSearchTerm}
                                            onChange={(e) => {
                                                setProductSearchTerm(e.target.value);
                                                setShowProductDropdown(true);
                                                setPpFormData({ ...ppFormData, productId: '' });
                                            }}
                                            onFocus={() => setShowProductDropdown(true)}
                                            className="w-full bg-gray-900 text-white px-4 py-2 pr-10 rounded border border-gray-700 focus:border-amber-500 outline-none"
                                            placeholder="Tìm và chọn sản phẩm..."
                                        />
                                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />

                                        {/* Dropdown danh sách sản phẩm */}
                                        {showProductDropdown && (
                                            <div className="absolute z-10 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                {filteredProductsForDropdown.length > 0 ? (
                                                    filteredProductsForDropdown.map((product) => (
                                                        <div
                                                            key={product.id}
                                                            onClick={() => handleSelectProduct(product)}
                                                            className="px-4 py-3 hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-800 last:border-0"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <img
                                                                    src={product.imageUrl || 'https://via.placeholder.com/50'}
                                                                    alt={product.name}
                                                                    className="w-10 h-10 object-cover rounded"
                                                                />
                                                                <div className="flex-1">
                                                                    <div className="text-white font-medium">{product.name}</div>
                                                                    <div className="text-amber-500 text-sm">
                                                                        {product.price.toLocaleString('vi-VN')}đ
                                                                    </div>
                                                                </div>
                                                                <div className="text-gray-400 text-xs">
                                                                    {product.category?.name}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-3 text-gray-400 text-center">
                                                        Không tìm thấy sản phẩm
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-white font-medium mb-2">Giảm giá (%) *</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={ppFormData.discountPercent}
                                        onChange={(e) => setPpFormData({ ...ppFormData, discountPercent: e.target.value })}
                                        className="w-full bg-gray-900 text-white px-4 py-2 rounded border border-gray-700 focus:border-amber-500 outline-none"
                                        placeholder="10"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-medium transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded font-medium transition-colors"
                                    >
                                        {editingItem ? 'Cập nhật' : 'Thêm'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminPromotions;