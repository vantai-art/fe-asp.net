import React, { useState, useEffect, useCallback } from "react";
import {
    Plus, Edit2, Trash2, Search, X, AlertCircle, CheckCircle,
    Users, RefreshCw, ChevronDown
} from "lucide-react";

const API_URL = "https://chuyen-de-asp.onrender.com/api";

const STATUSES = [
    { value: "Available", label: "Trống",         color: "text-green-400 bg-green-500/10 border-green-500/40",   dot: "bg-green-400" },
    { value: "Occupied",  label: "Đang có khách", color: "text-red-400 bg-red-500/10 border-red-500/40",         dot: "bg-red-400"   },
    { value: "Reserved",  label: "Đã đặt trước",  color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/40",dot: "bg-yellow-400"},
];
const getStatus = (val) => STATUSES.find(s => s.value === val) || STATUSES[0];
const TABLE_PREFIXES = ["Bàn", "VIP", "Sân vườn", "Phòng"];

function AdminTable() {
    const [tables, setTables]             = useState([]);
    const [loading, setLoading]           = useState(true);
    const [saving, setSaving]             = useState(false);
    const [searchTerm, setSearchTerm]     = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [showModal, setShowModal]       = useState(false);
    const [editing, setEditing]           = useState(null);
    const [toast, setToast]               = useState(null);
    const [formData, setFormData]         = useState({ tableNumber:"", capacity:4, status:"Available", note:"" });

    const getToken = () => localStorage.getItem("admin_token") || localStorage.getItem("staff_token");

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchTables = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/table`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setTables(Array.isArray(data) ? data : []);
        } catch (err) {
            showToast("error", "Không thể tải danh sách bàn: " + err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTables(); }, [fetchTables]);

    const openModal = (table = null) => {
        if (table) {
            setEditing(table);
            setFormData({ tableNumber: table.tableNumber||"", capacity: table.capacity||4, status: table.status||"Available", note: table.note||"" });
        } else {
            setEditing(null);
            setFormData({ tableNumber:"", capacity:4, status:"Available", note:"" });
        }
        setShowModal(true);
    };
    const closeModal = () => { setShowModal(false); setEditing(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const tn = formData.tableNumber.trim();
        if (!tn) { showToast("error", "Vui lòng nhập tên bàn!"); return; }
        if (formData.capacity < 1) { showToast("error", "Sức chứa phải ít nhất 1 người!"); return; }
        setSaving(true);
        const payload = { tableNumber: tn, capacity: Number(formData.capacity), status: formData.status, note: formData.note.trim()||null };
        try {
            let res;
            if (editing) {
                res = await fetch(`${API_URL}/table/${editing.id}`, {
                    method: "PUT",
                    headers: { "Content-Type":"application/json", Authorization:`Bearer ${getToken()}` },
                    body: JSON.stringify({ id: editing.id, ...payload }),
                });
            } else {
                res = await fetch(`${API_URL}/table`, {
                    method: "POST",
                    headers: { "Content-Type":"application/json", Authorization:`Bearer ${getToken()}` },
                    body: JSON.stringify(payload),
                });
            }
            if (!res.ok) {
                const err = await res.json().catch(()=>({}));
                throw new Error(err.message || `Lỗi ${res.status}`);
            }
            showToast("success", editing ? `Đã cập nhật bàn "${tn}"` : `Đã thêm bàn "${tn}"`);
            await fetchTables();
            closeModal();
        } catch (err) {
            showToast("error", err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (table, newStatus) => {
        if (table.status === newStatus) return;
        try {
            const res = await fetch(`${API_URL}/table/${table.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type":"application/json", Authorization:`Bearer ${getToken()}` },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.message||`Lỗi ${res.status}`); }
            setTables(prev => prev.map(t => t.id===table.id ? {...t, status:newStatus} : t));
            showToast("success", `Bàn "${table.tableNumber}" → ${getStatus(newStatus).label}`);
        } catch (err) { showToast("error", err.message); }
    };

    const handleDelete = async (table) => {
        if (!window.confirm(`Xóa bàn "${table.tableNumber}"?\nChỉ xóa được bàn đang trống và không có đơn hàng.`)) return;
        try {
            const res = await fetch(`${API_URL}/table/${table.id}`, {
                method: "DELETE",
                headers: { Authorization:`Bearer ${getToken()}` },
            });
            if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.message||`Lỗi ${res.status}`); }
            setTables(prev => prev.filter(t => t.id!==table.id));
            showToast("success", `Đã xóa bàn "${table.tableNumber}"`);
        } catch (err) { showToast("error", err.message); }
    };

    const filtered = tables.filter(t => {
        const matchSearch = (t.tableNumber||"").toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus==="all" || t.status===filterStatus;
        return matchSearch && matchStatus;
    });

    const stats = STATUSES.map(s => ({ ...s, count: tables.filter(t=>t.status===s.value).length }));

    return (
        <div className="p-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border
                    ${toast.type==="success" ? "bg-green-900/90 border-green-500 text-green-300" : "bg-red-900/90 border-red-500 text-red-300"}`}>
                    {toast.type==="success" ? <CheckCircle className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>}
                    <span className="text-sm font-medium">{toast.msg}</span>
                    <button onClick={()=>setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4"/></button>
                </div>
            )}

            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Quản Lý Bàn</h1>
                    <p className="text-gray-400">Thêm, sửa, xóa và cập nhật trạng thái bàn</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchTables} disabled={loading}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors">
                        <RefreshCw className={`w-4 h-4 ${loading?"animate-spin":""}`}/> Làm mới
                    </button>
                    <button onClick={()=>openModal()}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold transition-colors">
                        <Plus className="w-5 h-5"/> Thêm Bàn
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                    <div className="text-gray-400 text-xs mb-1">Tổng bàn</div>
                    <div className="text-white text-2xl font-bold">{tables.length}</div>
                </div>
                {stats.map(s=>(
                    <div key={s.value} className={`rounded-xl p-4 border ${s.color}`}>
                        <div className="text-xs mb-1 opacity-80">{s.label}</div>
                        <div className="text-2xl font-bold">{s.count}</div>
                    </div>
                ))}
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                    <input type="text" placeholder="Tìm kiếm tên bàn..." value={searchTerm}
                        onChange={e=>setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-amber-500 outline-none"/>
                </div>
                <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
                    className="bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-amber-500 outline-none min-w-[160px]">
                    <option value="all">Tất cả trạng thái</option>
                    {STATUSES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent"/>
                </div>
            )}

            {/* Empty */}
            {!loading && tables.length===0 && (
                <div className="text-center py-20 bg-gray-800 rounded-xl border border-gray-700">
                    <p className="text-gray-400 text-lg mb-4">Chưa có bàn nào</p>
                    <button onClick={()=>openModal()} className="text-amber-400 hover:text-amber-300 font-semibold">+ Thêm bàn đầu tiên</button>
                </div>
            )}

            {/* No results */}
            {!loading && tables.length>0 && filtered.length===0 && (
                <div className="text-center py-16 bg-gray-800 rounded-xl border border-gray-700">
                    <p className="text-gray-400">Không tìm thấy bàn phù hợp</p>
                </div>
            )}

            {/* Grid */}
            {!loading && filtered.length>0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map(table=>{
                        const st = getStatus(table.status);
                        return (
                            <div key={table.id}
                                className="bg-gray-800 border border-gray-700 hover:border-amber-500/60 rounded-xl p-5 transition-all flex flex-col gap-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="text-white font-bold text-xl leading-tight">{table.tableNumber}</h3>
                                        {table.note && <p className="text-gray-500 text-xs mt-1 line-clamp-1">{table.note}</p>}
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 flex items-center gap-1.5 ${st.color}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}/>
                                        {st.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <Users className="w-4 h-4"/>
                                    <span>Sức chứa: <span className="text-white font-semibold">{table.capacity}</span> người</span>
                                </div>
                                {/* Đổi trạng thái nhanh */}
                                <div>
                                    <label className="text-gray-500 text-xs mb-1.5 block">Cập nhật nhanh</label>
                                    <div className="relative">
                                        <select value={table.status} onChange={e=>handleStatusChange(table,e.target.value)}
                                            className={`w-full appearance-none px-3 py-2 pr-8 rounded-lg border text-sm font-medium outline-none cursor-pointer bg-gray-700 ${st.color}`}>
                                            {STATUSES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400"/>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2 border-t border-gray-700/60">
                                    <button onClick={()=>openModal(table)}
                                        className="flex-1 bg-blue-600/80 hover:bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-1.5 text-sm font-medium transition-colors">
                                        <Edit2 className="w-4 h-4"/> Sửa
                                    </button>
                                    <button onClick={()=>handleDelete(table)}
                                        disabled={table.status!=="Available"}
                                        title={table.status!=="Available" ? "Chỉ xóa được bàn trống" : "Xóa bàn"}
                                        className="flex-1 bg-red-600/80 hover:bg-red-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white py-2 rounded-lg flex items-center justify-center gap-1.5 text-sm font-medium transition-colors">
                                        <Trash2 className="w-4 h-4"/> Xóa
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-600 shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
                            <h2 className="text-xl font-bold text-white">
                                {editing ? `Sửa bàn "${editing.tableNumber}"` : "Thêm Bàn Mới"}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-6 h-6"/>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Tên bàn */}
                            <div>
                                <label className="text-white text-sm font-medium block mb-2">
                                    Tên bàn <span className="text-red-400">*</span>
                                    <span className="text-gray-500 font-normal ml-1">(VD: Bàn 01, VIP 01)</span>
                                </label>
                                <div className="flex gap-2 mb-2 flex-wrap">
                                    {TABLE_PREFIXES.map(p=>(
                                        <button key={p} type="button"
                                            onClick={()=>setFormData(f=>({...f, tableNumber: p+" "}))}
                                            className="text-xs bg-gray-700 hover:bg-amber-600/30 hover:text-amber-400 text-gray-400 border border-gray-600 hover:border-amber-500 px-2.5 py-1 rounded-lg transition-colors">
                                            {p}
                                        </button>
                                    ))}
                                </div>
                                <input type="text" value={formData.tableNumber}
                                    onChange={e=>setFormData(f=>({...f, tableNumber:e.target.value}))}
                                    placeholder="Nhập tên bàn..."
                                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-amber-500 outline-none"
                                    required autoFocus/>
                            </div>
                            {/* Sức chứa */}
                            <div>
                                <label className="text-white text-sm font-medium block mb-2">Sức chứa <span className="text-red-400">*</span></label>
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={()=>setFormData(f=>({...f,capacity:Math.max(1,f.capacity-1)}))}
                                        className="w-10 h-10 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold text-xl flex items-center justify-center">−</button>
                                    <input type="number" value={formData.capacity}
                                        onChange={e=>setFormData(f=>({...f,capacity:Math.max(1,Number(e.target.value))}))}
                                        min={1} max={50}
                                        className="flex-1 bg-gray-700 text-white text-center px-4 py-3 rounded-lg border border-gray-600 focus:border-amber-500 outline-none font-semibold"/>
                                    <button type="button" onClick={()=>setFormData(f=>({...f,capacity:f.capacity+1}))}
                                        className="w-10 h-10 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold text-xl flex items-center justify-center">+</button>
                                    <span className="text-gray-400 text-sm">người</span>
                                </div>
                            </div>
                            {/* Trạng thái */}
                            <div>
                                <label className="text-white text-sm font-medium block mb-2">Trạng thái</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {STATUSES.map(s=>(
                                        <button key={s.value} type="button"
                                            onClick={()=>setFormData(f=>({...f,status:s.value}))}
                                            className={`py-2.5 px-2 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5
                                                ${formData.status===s.value ? `${s.color} scale-105 shadow-lg` : "bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500"}`}>
                                            <span className={`w-2 h-2 rounded-full ${formData.status===s.value?s.dot:"bg-gray-500"}`}/>
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Ghi chú */}
                            <div>
                                <label className="text-white text-sm font-medium block mb-2">Ghi chú</label>
                                <input type="text" value={formData.note}
                                    onChange={e=>setFormData(f=>({...f,note:e.target.value}))}
                                    placeholder="VD: Phòng riêng có máy lạnh..."
                                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-amber-500 outline-none"/>
                            </div>
                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={closeModal}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors">Hủy</button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                                    {saving ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> Đang lưu...</> : editing?"Cập Nhật":"Thêm Bàn"}
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
