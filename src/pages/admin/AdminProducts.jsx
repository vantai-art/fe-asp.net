// src/pages/admin/AdminProducts.jsx  ← FIXED
import React, { useState, useEffect, useRef } from "react";
import { Plus, Edit2, Trash2, Search, X, Upload, Link, ToggleLeft, ToggleRight } from "lucide-react";

const API_URL = "https://chuyen-de-asp.onrender.com/api";

function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [previewImage, setPreviewImage] = useState("");
    const imageInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        imageUrl: "",
        categoryId: "",
        isAvailable: true,
    });

    const getToken = () => localStorage.getItem("admin_token");

    // ─── Fetch products & categories ─────────────────────────────
    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_URL}/food`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Lỗi tải sản phẩm:", err);
            setError("Không thể tải sản phẩm từ server");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_URL}/category`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (res.ok) {
                const data = await res.json();
                setCategories(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Lỗi tải danh mục:", err);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    // ─── Modal ────────────────────────────────────────────────────
    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name || "",
                description: product.description || "",
                price: product.price || "",
                imageUrl: product.imageUrl || "",
                categoryId: product.categoryId || product.category?.id || "",
                isAvailable: product.isAvailable !== undefined ? product.isAvailable : true,
            });
            setPreviewImage(product.imageUrl || "");
        } else {
            setEditingProduct(null);
            setFormData({ name: "", description: "", price: "", imageUrl: "", categoryId: "", isAvailable: true });
            setPreviewImage("");
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProduct(null);
        setPreviewImage("");
    };

    // ─── Ảnh ─────────────────────────────────────────────────────
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert("Ảnh quá lớn! Chọn ảnh < 5MB"); return; }
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result);
            setFormData((f) => ({ ...f, imageUrl: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleImageURLChange = (e) => {
        const url = e.target.value;
        setFormData((f) => ({ ...f, imageUrl: url }));
        setPreviewImage(url);
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
            if (item.type.startsWith("image/")) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    const url = URL.createObjectURL(file);
                    setPreviewImage(url);
                    setFormData((f) => ({ ...f, imageUrl: url }));
                }
                return;
            }
            if (item.type === "text/plain") {
                item.getAsString((text) => {
                    if (/^https?:\/\//i.test(text)) {
                        setFormData((f) => ({ ...f, imageUrl: text }));
                        setPreviewImage(text);
                    }
                });
            }
        }
    };

    // ─── Lưu sản phẩm ────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) { alert("Vui lòng nhập tên sản phẩm!"); return; }
        if (!formData.categoryId) { alert("Vui lòng chọn danh mục!"); return; }
        if (!formData.price || Number(formData.price) <= 0) { alert("Vui lòng nhập giá hợp lệ!"); return; }

        setSubmitting(true);

        // ✅ Payload khớp với Food model của BE:
        //   Id, Name, Description, Price, ImageUrl, IsAvailable, CategoryId
        //   KHÔNG có StockQuantity (Food model không có trường này)
        const payload = {
            name: formData.name.trim(),
            description: formData.description.trim() || "",
            price: Number(formData.price),
            imageUrl: formData.imageUrl || "",
            isAvailable: formData.isAvailable,
            categoryId: Number(formData.categoryId),
        };

        try {
            const token = getToken();
            let res;

            if (editingProduct) {
                // PUT /api/food/{id}  ← BE kiểm tra id == food.Id
                res = await fetch(`${API_URL}/food/${editingProduct.id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ id: editingProduct.id, ...payload }),
                });
            } else {
                // POST /api/food
                res = await fetch(`${API_URL}/food`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });
            }

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || `Lỗi ${res.status}`);
            }

            await fetchProducts();
            handleCloseModal();
            alert(`✅ ${editingProduct ? "Cập nhật" : "Thêm"} sản phẩm thành công!`);
        } catch (err) {
            console.error("Lỗi lưu sản phẩm:", err);
            alert(`❌ ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Xóa ─────────────────────────────────────────────────────
    const handleDelete = async (id, name) => {
        if (!window.confirm(`Bạn có chắc muốn xóa sản phẩm "${name}"?\nLưu ý: không thể xóa nếu sản phẩm đã có trong đơn hàng.`)) return;
        try {
            const res = await fetch(`${API_URL}/food/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                const msg = errData.message || `Lỗi ${res.status}`;
                // Gợi ý tắt phục vụ thay vì xóa khi món đã có trong đơn hàng
                if (res.status === 400 && msg.includes("đơn hàng")) {
                    const doToggle = window.confirm(
                        `⚠️ Không thể xóa:\n"${msg}"\n\nBạn có muốn ẩn/tắt phục vụ món này thay thế không?`
                    );
                    if (doToggle) await handleToggle(id);
                    return;
                }
                throw new Error(msg);
            }
            setProducts((prev) => prev.filter((p) => p.id !== id));
            alert("✅ Xóa sản phẩm thành công!");
        } catch (err) {
            console.error("Lỗi xóa sản phẩm:", err);
            alert(`❌ ${err.message}`);
        }
    };

    // ─── Toggle bật/tắt phục vụ ──────────────────────────────────
    const handleToggle = async (id) => {
        try {
            const res = await fetch(`${API_URL}/food/${id}/toggle`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (!res.ok) throw new Error(`Lỗi ${res.status}`);
            const data = await res.json();
            setProducts((prev) =>
                prev.map((p) => (p.id === id ? { ...p, isAvailable: data.isAvailable } : p))
            );
        } catch (err) {
            console.error("Lỗi toggle:", err);
            alert(`❌ ${err.message}`);
        }
    };

    const filteredProducts = products.filter(
        (p) =>
            p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-6 text-gray-400">Đang tải dữ liệu sản phẩm...</div>;
    if (error) return <div className="p-6 text-red-500">{error}</div>;

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Quản Lý Sản Phẩm</h1>
                <p className="text-gray-400">Quản lý danh sách sản phẩm của cửa hàng</p>
            </div>

            {/* Tìm kiếm + Thêm */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm sản phẩm hoặc danh mục..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 text-white pl-12 pr-4 py-3 rounded-lg border border-gray-700 focus:border-amber-500 outline-none"
                    />
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 whitespace-nowrap"
                >
                    <Plus className="w-5 h-5" /> Thêm Sản Phẩm
                </button>
            </div>

            {/* Thống kê nhanh */}
            <div className="text-gray-400 text-sm mb-4">
                Hiển thị <span className="text-white font-semibold">{filteredProducts.length}</span> /
                <span className="text-white font-semibold"> {products.length}</span> sản phẩm
            </div>

            {/* Danh sách */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                        <div
                            key={product.id}
                            className={`bg-gray-800 rounded-lg overflow-hidden border transition-colors ${product.isAvailable ? "border-gray-700 hover:border-amber-500" : "border-red-800 opacity-75"}`}
                        >
                            <div className="relative">
                                <img
                                    src={product.imageUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%231f2937'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-size='16'%3EKhông có ảnh%3C/text%3E%3C/svg%3E"}
                                    alt={product.name}
                                    className="w-full h-48 object-cover"
                                    onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%231f2937'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-size='16'%3EKhông có ảnh%3C/text%3E%3C/svg%3E"; }}
                                />
                                {!product.isAvailable && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">Ngừng phục vụ</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-white font-bold text-lg leading-tight">{product.name}</h3>
                                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded ml-2 flex-shrink-0">
                                        {product.category?.name || "Khác"}
                                    </span>
                                </div>
                                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.description}</p>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-amber-500 font-bold text-xl">
                                        {(product.price || 0).toLocaleString("vi-VN")}đ
                                    </span>
                                    <button
                                        onClick={() => handleToggle(product.id)}
                                        className={`text-sm flex items-center gap-1 ${product.isAvailable ? "text-green-400" : "text-red-400"}`}
                                        title="Bật/tắt phục vụ"
                                    >
                                        {product.isAvailable
                                            ? <><ToggleRight className="w-5 h-5" /> Phục vụ</>
                                            : <><ToggleLeft className="w-5 h-5" /> Tắt</>}
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(product)}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded flex items-center justify-center gap-2 text-sm"
                                    >
                                        <Edit2 className="w-4 h-4" /> Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id, product.name)}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded flex items-center justify-center gap-2 text-sm"
                                    >
                                        <Trash2 className="w-4 h-4" /> Xóa
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center text-gray-400 py-12">
                        {searchTerm ? "Không tìm thấy sản phẩm phù hợp" : "Chưa có sản phẩm nào"}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white">
                                {editingProduct ? "Chỉnh Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}
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

                            {/* Giá + Danh mục */}
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
                                    <label className="block text-white mb-2 font-medium">Danh Mục *</label>
                                    <select
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                        className="w-full bg-gray-700 text-white px-4 py-3 rounded border border-gray-600 focus:border-amber-500 outline-none"
                                    >
                                        <option value="">-- Chọn danh mục --</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Trạng thái */}
                            <div className="flex items-center gap-3">
                                <label className="text-white font-medium">Trạng thái:</label>
                                <button
                                    type="button"
                                    onClick={() => setFormData((f) => ({ ...f, isAvailable: !f.isAvailable }))}
                                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${formData.isAvailable ? "bg-green-600 text-white" : "bg-gray-600 text-gray-300"}`}
                                >
                                    {formData.isAvailable ? "✅ Đang phục vụ" : "⏸ Ngừng phục vụ"}
                                </button>
                            </div>

                            {/* Hình ảnh */}
                            <div>
                                <label className="block text-white mb-2 font-medium">
                                    Hình Ảnh Sản Phẩm
                                    <span className="text-gray-400 text-sm ml-2">(hỗ trợ Ctrl+V)</span>
                                </label>
                                {previewImage && (
                                    <div className="relative mb-3">
                                        <img
                                            src={previewImage}
                                            alt="Preview"
                                            className="w-full h-48 object-cover rounded border border-gray-600"
                                            onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%231f2937'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-size='16'%3EKhông có ảnh%3C/text%3E%3C/svg%3E"; }}
                                        />
                                        <button
                                            onClick={() => { setPreviewImage(""); setFormData((f) => ({ ...f, imageUrl: "" })); }}
                                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                <div
                                    onPaste={handlePaste}
                                    onClick={() => imageInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-600 rounded-lg p-6 mb-3 bg-gray-700/50 hover:border-amber-500 transition-colors cursor-pointer"
                                >
                                    <div className="text-center">
                                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                        <p className="text-white font-medium text-sm mb-1">Nhấp để chọn hoặc kéo thả ảnh</p>
                                        <p className="text-gray-400 text-xs">Hoặc Ctrl+V để dán ảnh từ clipboard</p>
                                    </div>
                                    <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                                </div>
                                <div className="relative">
                                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Hoặc dán URL ảnh từ web..."
                                        value={formData.imageUrl}
                                        onChange={handleImageURLChange}
                                        onPaste={handlePaste}
                                        className="w-full bg-gray-700 text-white pl-10 pr-4 py-3 rounded border border-gray-600 focus:border-amber-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white py-3 rounded font-semibold"
                                >
                                    {submitting ? "Đang lưu..." : (editingProduct ? "Cập Nhật" : "Thêm Mới")}
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
