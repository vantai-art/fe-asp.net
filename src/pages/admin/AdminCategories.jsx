import React, { useState, useEffect, useRef } from "react";
import { Plus, Edit2, Trash2, FolderOpen, X, Upload, LinkIcon } from "lucide-react";
import { categoryAPI } from "../../services/api";

function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [previewImage, setPreviewImage] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        imageUrl: "",
        color: "#D97706",
    });
    const imageInputRef = useRef(null);

    // 🔹 Lấy danh mục từ database
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await categoryAPI.getAll();
                const data =
                    Array.isArray(res?.data) || Array.isArray(res)
                        ? res.data || res
                        : [res];
                setCategories(data);
            } catch (error) {
                console.error("Lỗi tải danh mục:", error);
                setCategories([]);
            }
        };
        fetchCategories();
    }, []);

    // 🔹 Mở modal thêm hoặc sửa
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
            setFormData({
                name: "",
                description: "",
                imageUrl: "",
                color: "#D97706",
            });
            setPreviewImage("");
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCategory(null);
        setPreviewImage("");
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
                setFormData({ ...formData, imageUrl: base64String });
            };
            reader.readAsDataURL(file);
        }
    };

    // 🔹 Nhập URL ảnh
    const handleImageURLChange = (e) => {
        const url = e.target.value;
        setFormData({ ...formData, imageUrl: url });
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
                    setFormData({ ...formData, imageUrl: localURL });
                }
                break;
            }

            // Kiểm tra nếu là text (có thể là URL)
            if (item.type === 'text/plain') {
                item.getAsString((text) => {
                    // Kiểm tra xem có phải URL hình ảnh không
                    if (text.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i) ||
                        text.match(/^https?:\/\//)) {
                        setFormData({ ...formData, imageUrl: text });
                        setPreviewImage(text);
                    }
                });
            }
        }
    };

    // 🔹 Thêm hoặc cập nhật danh mục
    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            alert("Vui lòng nhập tên danh mục!");
            return;
        }

        try {
            if (editingCategory) {
                await categoryAPI.update(editingCategory.id, formData);
            } else {
                await categoryAPI.create(formData);
            }

            // Refresh lại danh sách
            const refreshed = await categoryAPI.getAll();
            const data =
                Array.isArray(refreshed?.data) || Array.isArray(refreshed)
                    ? refreshed.data || refreshed
                    : [refreshed];
            setCategories(data);
            handleCloseModal();
        } catch (error) {
            console.error("Lỗi lưu danh mục:", error);
            alert("Không thể lưu danh mục!");
        }
    };

    // 🔹 Xóa danh mục
    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xóa danh mục này?")) return;
        try {
            await categoryAPI.delete(id);
            setCategories(categories.filter((c) => c.id !== id));
        } catch (error) {
            console.error("Lỗi xóa danh mục:", error);
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

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Quản Lý Danh Mục</h1>
                <p className="text-gray-400">Quản lý các danh mục sản phẩm của cửa hàng</p>
            </div>

            {/* Nút thêm */}
            <div className="flex justify-between items-center mb-6">
                <div className="text-gray-400">
                    Tổng số:{" "}
                    <span className="text-white font-semibold">{categories.length}</span> danh mục
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Thêm Danh Mục
                </button>
            </div>

            {/* Danh sách danh mục */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categories.length > 0 ? (
                    categories.map((category) => (
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
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <FolderOpen className="w-16 h-16 text-white/80" />
                                    </div>
                                )}
                            </div>

                            <div className="p-5">
                                <h3 className="text-white font-bold text-xl mb-2">{category.name}</h3>
                                <p className="text-gray-400 text-sm mb-4 min-h-[40px]">{category.description}</p>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(category)}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded flex items-center justify-center gap-2"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category.id)}
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
                    <div className="text-gray-400">Không có danh mục nào</div>
                )}
            </div>

            {/* Modal thêm/sửa */}
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
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    className="w-full bg-gray-700 text-white px-4 py-3 rounded border border-gray-600 focus:border-amber-500 outline-none"
                                    rows={3}
                                    placeholder="Mô tả về danh mục này"
                                />
                            </div>

                            {/* Ảnh - Hỗ trợ dán */}
                            <div>
                                <label className="block text-white mb-2 font-medium">
                                    Ảnh Danh Mục
                                    <span className="text-gray-400 text-sm ml-2">(Hỗ trợ dán Ctrl+V)</span>
                                </label>

                                {/* Preview ảnh */}
                                {previewImage && (
                                    <div className="relative mb-3">
                                        <img
                                            src={previewImage}
                                            alt="Preview"
                                            className="w-full h-40 object-cover rounded border border-gray-600"
                                        />
                                        <button
                                            onClick={() => {
                                                setPreviewImage("");
                                                setFormData({ ...formData, imageUrl: "" });
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
                                    <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                                            onClick={() => setFormData({ ...formData, color: color.value })}
                                            className={`p-4 rounded-lg border-2 transition-all ${formData.color === color.value
                                                ? "border-white scale-105"
                                                : "border-gray-600 hover:border-gray-500"
                                                }`}
                                            style={{ backgroundColor: color.value }}
                                        >
                                            <span className="text-white font-medium text-sm">
                                                {color.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded font-semibold"
                                >
                                    {editingCategory ? "Cập Nhật" : "Thêm Mới"}
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