// src/pages/admin/AdminCategories.jsx  ← FIXED
import React, { useState, useEffect, useRef } from "react";
import { Plus, Edit2, Trash2, FolderOpen, X, Upload, LinkIcon } from "lucide-react";

const API_URL = "https://chuyen-de-asp.onrender.com/api";

function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [previewImage, setPreviewImage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        imageUrl: "",
        color: "#D97706",
    });
    const imageInputRef = useRef(null);

    const getToken = () => localStorage.getItem("admin_token");

    // ─── Fetch danh mục ───────────────────────────────────────────
    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_URL}/category`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Lỗi tải danh mục:", err);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    // ─── Modal ────────────────────────────────────────────────────
    const handleOpenModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name || "",
                description: category.description || "",
                imageUrl: category.imageUrl || "",
                color: category.color || "#D97706",
            });
            setPreviewImage(category.imageUrl || "");
        } else {
            setEditingCategory(null);
            setFormData({ name: "", description: "", imageUrl: "", color: "#D97706" });
            setPreviewImage("");
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCategory(null);
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

    // ─── Lưu (POST / PUT) ────────────────────────────────────────
    const handleSubmit = async () => {
        if (!formData.name.trim()) { alert("Vui lòng nhập tên danh mục!"); return; }
        setSubmitting(true);

        try {
            const token = getToken();

            if (editingCategory) {
                // PUT /api/category/{id}  ← BE yêu cầu body phải có Id khớp
                const res = await fetch(`${API_URL}/category/${editingCategory.id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        id: editingCategory.id,          // ← BẮT BUỘC: BE kiểm tra id == category.Id
                        name: formData.name.trim(),
                        description: formData.description || "",
                        // imageUrl & color không có trong Category model của BE,
                        // chỉ truyền các trường BE biết
                    }),
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.message || `Lỗi cập nhật (${res.status})`);
                }
            } else {
                // POST /api/category
                const res = await fetch(`${API_URL}/category`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: formData.name.trim(),
                        description: formData.description || "",
                    }),
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.message || `Lỗi tạo danh mục (${res.status})`);
                }
            }

            await fetchCategories();
            handleCloseModal();
            alert(`✅ ${editingCategory ? "Cập nhật" : "Thêm"} danh mục thành công!`);
        } catch (err) {
            console.error("Lỗi lưu danh mục:", err);
            alert(`❌ ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Xóa ─────────────────────────────────────────────────────
    const handleDelete = async (id, name) => {
        if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${name}"?\nLưu ý: không thể xóa nếu đang có sản phẩm trong danh mục này.`)) return;
        try {
            const res = await fetch(`${API_URL}/category/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || `Lỗi xóa (${res.status})`);
            }
            setCategories((prev) => prev.filter((c) => c.id !== id));
            alert("✅ Xóa danh mục thành công!");
        } catch (err) {
            console.error("Lỗi xóa danh mục:", err);
            alert(`❌ ${err.message}`);
        }
    };

    const colorOptions = [
        { value: "#D97706", name: "Cam" },
        { value: "#DC2626", name: "Đỏ" },
        { value: "#3B82F6", name: "Xanh Dương" },
        { value: "#EC4899", name: "Hồng" },
        { value: "#10B981", name: "Xanh Lá" },
        { value: "#8B5CF6", name: "Tím" },
    ];

    if (loading) return <div className="p-6 text-gray-400">Đang tải danh mục...</div>;

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Quản Lý Danh Mục</h1>
                <p className="text-gray-400">Quản lý các danh mục sản phẩm của cửa hàng</p>
            </div>

            <div className="flex justify-between items-center mb-6">
                <div className="text-gray-400">
                    Tổng số: <span className="text-white font-semibold">{categories.length}</span> danh mục
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Thêm Danh Mục
                </button>
            </div>

            {/* Danh sách */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categories.length > 0 ? categories.map((category) => (
                    <div
                        key={category.id}
                        className="bg-gray-800 rounded-lg border border-gray-700 hover:border-amber-500 transition-colors overflow-hidden"
                    >
                        <div
                            className="relative w-full h-40 overflow-hidden bg-gray-700"
                            style={{ backgroundColor: category.color || "#374151" }}
                        >
                            {category.imageUrl ? (
                                <img
                                    src={category.imageUrl}
                                    alt={category.name}
                                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                    onError={(e) => { e.target.style.display = "none"; }}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <FolderOpen className="w-16 h-16 text-white/80" />
                                </div>
                            )}
                        </div>
                        <div className="p-5">
                            <h3 className="text-white font-bold text-xl mb-1">{category.name}</h3>
                            <p className="text-gray-400 text-sm mb-1">{category.description}</p>
                            {category.foodCount !== undefined && (
                                <p className="text-amber-400 text-xs mb-4">{category.foodCount} sản phẩm</p>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleOpenModal(category)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded flex items-center justify-center gap-2"
                                >
                                    <Edit2 className="w-4 h-4" /> Sửa
                                </button>
                                <button
                                    onClick={() => handleDelete(category.id, category.name)}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" /> Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full text-center text-gray-400 py-12">
                        Không có danh mục nào
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full my-8">
                        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white">
                                {editingCategory ? "Chỉnh Sửa Danh Mục" : "Thêm Danh Mục Mới"}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-white mb-2 font-medium">Tên Danh Mục *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-gray-700 text-white px-4 py-3 rounded border border-gray-600 focus:border-amber-500 outline-none"
                                    placeholder="Nhập tên danh mục"
                                />
                            </div>

                            <div>
                                <label className="block text-white mb-2 font-medium">Mô Tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-gray-700 text-white px-4 py-3 rounded border border-gray-600 focus:border-amber-500 outline-none"
                                    rows={3}
                                    placeholder="Mô tả về danh mục này"
                                />
                            </div>

                            {/* Ảnh */}
                            <div>
                                <label className="block text-white mb-2 font-medium">
                                    Ảnh Danh Mục
                                    <span className="text-gray-400 text-sm ml-2">(tuỳ chọn, hỗ trợ Ctrl+V)</span>
                                </label>
                                {previewImage && (
                                    <div className="relative mb-3">
                                        <img
                                            src={previewImage}
                                            alt="Preview"
                                            className="w-full h-40 object-cover rounded border border-gray-600"
                                            onError={(e) => { e.target.style.display = "none"; }}
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
                                        <p className="text-gray-400 text-xs">Hoặc nhấn Ctrl+V để dán ảnh</p>
                                    </div>
                                    <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                                </div>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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

                            {/* Màu */}
                            <div>
                                <label className="block text-white mb-2 font-medium">Màu Sắc</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {colorOptions.map((color) => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color: color.value })}
                                            className={`p-4 rounded-lg border-2 transition-all ${formData.color === color.value ? "border-white scale-105" : "border-gray-600 hover:border-gray-500"}`}
                                            style={{ backgroundColor: color.value }}
                                        >
                                            <span className="text-white font-medium text-sm">{color.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white py-3 rounded font-semibold"
                                >
                                    {submitting ? "Đang lưu..." : (editingCategory ? "Cập Nhật" : "Thêm Mới")}
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

export default AdminCategories;
