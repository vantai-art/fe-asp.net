import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, X, AlertCircle, CheckCircle } from "lucide-react";

function AdminTable() {
    const [tables, setTables] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [formData, setFormData] = useState({
        number: "",
        capacity: "",
        status: "FREE",
    });

    const API_BASE = "https://chuyen-de-asp.onrender.com/api";

    // ✅ Lấy token từ localStorage
    const getToken = () => {
        return localStorage.getItem("admin_token") ||
            localStorage.getItem("staff_token") ||
            localStorage.getItem("user_token");
    };

    // ✅ Helper: Parse JSON an toàn
    const safeJsonParse = async (response) => {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                return await response.json();
            } catch (e) {
                console.error('JSON parse error:', e);
                return null;
            }
        }
        return null;
    };

    // ✅ FIXED: Lấy danh sách bàn từ database
    const fetchTables = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = getToken();

            if (!token) {
                throw new Error("Chưa đăng nhập!");
            }

            const res = await fetch(`${API_BASE}/table`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 Fetch tables status:', res.status);

            if (!res.ok) {
                if (res.status === 401) {
                    localStorage.removeItem('admin_token');
                    localStorage.removeItem('staff_token');
                    throw new Error("Phiên hết hạn! Vui lòng đăng nhập lại.");
                }
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const data = await safeJsonParse(res);
            setTables(Array.isArray(data) ? data : []);
            console.log("✅ Loaded tables:", Array.isArray(data) ? data.length : 0);
        } catch (err) {
            console.error("❌ Lỗi fetch tables:", err);
            setError(err.message || "Không thể tải danh sách bàn");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTables();
    }, []);

    // ✅ FIXED: Thêm/Sửa bàn
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        // Validate
        if (!formData.number || Number(formData.number) <= 0) {
            setError("Số bàn phải lớn hơn 0!");
            setLoading(false);
            return;
        }

        if (!formData.capacity || Number(formData.capacity) <= 0) {
            setError("Sức chứa phải lớn hơn 0!");
            setLoading(false);
            return;
        }

        const token = getToken();
        if (!token) {
            setError("Chưa đăng nhập!");
            setLoading(false);
            return;
        }

        const method = editing ? "PUT" : "POST";
        const url = editing
            ? `${API_BASE}/table/${editing.id}`
            : `${API_BASE}/table`;

        const payload = {
            number: Number(formData.number),
            capacity: Number(formData.capacity),
            status: formData.status,
        };

        console.log('📤 Payload:', payload);

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            console.log('📡 Submit status:', res.status);

            if (!res.ok) {
                if (res.status === 401) {
                    localStorage.removeItem('admin_token');
                    throw new Error("Phiên hết hạn!");
                }

                let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
                const data = await safeJsonParse(res);

                if (data?.message) {
                    errorMessage = data.message;
                } else {
                    const text = await res.text();
                    if (text) errorMessage = text;
                }

                throw new Error(errorMessage);
            }

            // ✅ Parse JSON an toàn
            const data = await safeJsonParse(res);
            console.log("✅ Saved table:", data);

            setSuccess(editing ? "Cập nhật bàn thành công!" : "Thêm bàn mới thành công!");
            await fetchTables();
            setShowModal(false);
            setEditing(null);
            setFormData({ number: "", capacity: "", status: "FREE" });

            // Tự động ẩn thông báo sau 3s
            setTimeout(() => setSuccess(null), 3000);

        } catch (err) {
            console.error("❌ Lỗi lưu bàn:", err);
            setError(err.message || "Không thể lưu bàn. Vui lòng thử lại!");
        } finally {
            setLoading(false);
        }
    };

    // ✅ FIXED: Xóa bàn
    const handleDelete = async (id, tableNumber) => {
        if (!window.confirm(`Bạn có chắc muốn xóa Bàn ${tableNumber}?`)) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = getToken();

            if (!token) {
                throw new Error("Chưa đăng nhập!");
            }

            console.log('🗑️ Deleting table:', id);

            const res = await fetch(`${API_BASE}/table/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            console.log('📡 Delete status:', res.status);

            // ✅ Chấp nhận cả 200 OK và 204 No Content
            if (res.ok || res.status === 204) {
                console.log("✅ Deleted table:", id);
                setSuccess(`Đã xóa Bàn ${tableNumber} thành công!`);
                await fetchTables();
                setTimeout(() => setSuccess(null), 3000);
            } else {
                if (res.status === 401) {
                    localStorage.removeItem('admin_token');
                    throw new Error("Phiên hết hạn!");
                }

                let errorMsg = `HTTP ${res.status}: ${res.statusText}`;

                // ✅ Parse JSON an toàn
                const data = await safeJsonParse(res);
                if (data?.message) {
                    errorMsg = data.message;
                } else {
                    const text = await res.text();
                    if (text) errorMsg = text;
                }

                throw new Error(errorMsg);
            }
        } catch (err) {
            console.error("❌ Lỗi xóa bàn:", err);
            setError(err.message || "Không thể xóa bàn. Vui lòng thử lại!");
        } finally {
            setLoading(false);
        }
    };

    // Lọc bàn theo số bàn
    const filteredTables = tables.filter((t) =>
        t.number?.toString().includes(searchTerm)
    );

    // Màu sắc theo trạng thái
    const getStatusColor = (status) => {
        switch (status) {
            case "FREE": return "text-green-400 bg-green-500/10 border-green-500/50";
            case "OCCUPIED": return "text-red-400 bg-red-500/10 border-red-500/50";
            case "RESERVED": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/50";
            default: return "text-gray-400 bg-gray-500/10 border-gray-500/50";
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "FREE": return "Trống";
            case "OCCUPIED": return "Đang có khách";
            case "RESERVED": return "Đã đặt";
            default: return status;
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Quản Lý Bàn</h1>
                    <p className="text-gray-400">Xem và chỉnh sửa danh sách bàn trong quán</p>
                </div>
                <button
                    onClick={() => {
                        setEditing(null);
                        setFormData({ number: "", capacity: "", status: "FREE" });
                        setShowModal(true);
                        setError(null);
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold transition-colors"
                >
                    <Plus className="w-5 h-5" /> Thêm Bàn Mới
                </button>
            </div>

            {/* Success Message */}
            {success && (
                <div className="mb-6 bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg flex items-center gap-3">
                    <CheckCircle className="w-5 h-5" />
                    <span>{success}</span>
                    <button onClick={() => setSuccess(null)} className="ml-auto hover:text-green-300">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto hover:text-red-300">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Search */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Tìm kiếm theo số bàn..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-amber-500 outline-none"
                />
            </div>

            {/* Loading State */}
            {loading && tables.length === 0 && (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-amber-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Đang tải dữ liệu...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && tables.length === 0 && (
                <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-gray-400 text-lg mb-4">Chưa có bàn nào</p>
                    <button
                        onClick={() => {
                            setEditing(null);
                            setFormData({ number: "", capacity: "", status: "FREE" });
                            setShowModal(true);
                        }}
                        className="text-amber-500 hover:text-amber-400 font-semibold"
                    >
                        Thêm bàn đầu tiên
                    </button>
                </div>
            )}

            {/* Tables Grid */}
            {filteredTables.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredTables.map((table) => (
                        <div
                            key={table.id}
                            className="bg-gray-800 border border-gray-700 rounded-lg p-5 hover:border-amber-500 transition-all"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="text-2xl font-bold text-white">
                                    Bàn {table.number}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(table.status)}`}>
                                    {getStatusText(table.status)}
                                </span>
                            </div>

                            <p className="text-gray-400 text-sm mb-4">
                                👥 Sức chứa: <span className="font-semibold text-white">{table.capacity}</span> người
                            </p>

                            <div className="flex gap-2 pt-4 border-t border-gray-700">
                                <button
                                    onClick={() => {
                                        setEditing(table);
                                        setFormData({
                                            number: table.number,
                                            capacity: table.capacity,
                                            status: table.status,
                                        });
                                        setShowModal(true);
                                        setError(null);
                                    }}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Sửa
                                </button>
                                <button
                                    onClick={() => handleDelete(table.id, table.number)}
                                    disabled={loading}
                                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Xóa
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No Results */}
            {filteredTables.length === 0 && tables.length > 0 && !loading && (
                <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-gray-400">Không tìm thấy bàn nào</p>
                </div>
            )}

            {/* Modal Thêm/Sửa */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg w-full max-w-md border border-gray-700 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {editing ? "Cập Nhật Bàn" : "Thêm Bàn Mới"}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setError(null);
                                }}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-white block mb-2 font-medium">
                                    Số Bàn <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.number}
                                    onChange={(e) =>
                                        setFormData({ ...formData, number: e.target.value })
                                    }
                                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-amber-500 outline-none"
                                    required
                                    min="1"
                                    placeholder="Nhập số bàn"
                                />
                            </div>

                            <div>
                                <label className="text-white block mb-2 font-medium">
                                    Sức Chứa <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.capacity}
                                    onChange={(e) =>
                                        setFormData({ ...formData, capacity: e.target.value })
                                    }
                                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-amber-500 outline-none"
                                    required
                                    min="1"
                                    placeholder="Số người tối đa"
                                />
                            </div>

                            <div>
                                <label className="text-white block mb-2 font-medium">Trạng Thái</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) =>
                                        setFormData({ ...formData, status: e.target.value })
                                    }
                                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-amber-500 outline-none"
                                >
                                    <option value="FREE">Trống</option>
                                    <option value="OCCUPIED">Đang có khách</option>
                                    <option value="RESERVED">Đã đặt trước</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setError(null);
                                    }}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                            <span>Đang lưu...</span>
                                        </>
                                    ) : (
                                        editing ? 'Cập Nhật' : 'Thêm Mới'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminTable;