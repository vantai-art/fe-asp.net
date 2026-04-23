import React, { useState, useEffect } from 'react';
import { Search, Eye, Trash2, User, Mail, Phone, Shield, X, Plus, Edit } from 'lucide-react';

function AdminStaff() {
    const [staff, setStaff] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('Tất cả');
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const roleOptions = [
        { value: 'Tất cả', label: 'Tất cả' },
        { value: 'ADMIN', label: 'Quản trị viên' },
        { value: 'EMPLOYEE', label: 'Nhân viên' },
        { value: 'STAFF', label: 'Thu ngân' }
    ];

    const [newStaff, setNewStaff] = useState({
        username: '',
        password: '',
        fullName: '',
        email: '',
        phone: '',
        role: 'STAFF'
    });

    // ✅ Fetch danh sách nhân viên
    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            // BE mới: /auth/users - trả về role là "Admin" hoặc "Staff"
            const res = await fetch('https://chuyen-de-asp.onrender.com/api/auth/users', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!res.ok) throw new Error('Không thể tải danh sách nhân viên');
            const data = await res.json();

            // BE mới role là "Admin" hoặc "Staff" (viết hoa chữ đầu)
            const staffOnly = data.filter(u =>
                ['Admin', 'Staff', 'ADMIN', 'EMPLOYEE', 'STAFF'].includes(u.role || u.roles?.[0]?.name)
            );

            const mapped = staffOnly.map((u) => ({
                id: u.id,
                username: u.username,
                fullName: u.fullName || u.username || 'Không rõ',
                email: u.email || 'Chưa có email',
                phone: u.phone || 'N/A',
                role: u.role || u.roles?.[0]?.name || 'Staff',
                isActive: u.isActive,
                createdAt: u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString('vi-VN')
                    : 'N/A',
            }));
            setStaff(mapped);
        } catch (err) {
            console.error(err);
            setError('Không thể tải dữ liệu nhân viên');
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'ADMIN':
                return { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Quản trị viên' };
            case 'EMPLOYEE':
                return { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Nhân viên' };
            case 'STAFF':
                return { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Thu ngân' };
            default:
                return { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Khác' };
        }
    };

    const handleViewDetail = (staffMember) => {
        setSelectedStaff(staffMember);
        setShowDetailModal(true);
    };

    // ✅ Thêm nhân viên mới
    const handleAddStaff = async (e) => {
        e.preventDefault();

        if (!newStaff.username || !newStaff.password || !newStaff.fullName) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
            return;
        }

        try {
            const token = localStorage.getItem('admin_token');
            // BE mới: /auth/register (admin only), role phải là "Admin" hoặc "Staff"
            const roleMap = { 'ADMIN': 'Admin', 'STAFF': 'Staff', 'EMPLOYEE': 'Staff', 'Admin': 'Admin', 'Staff': 'Staff' };
            const res = await fetch('https://chuyen-de-asp.onrender.com/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    username: newStaff.username,
                    password: newStaff.password,
                    fullName: newStaff.fullName,
                    role: roleMap[newStaff.role] || 'Staff'
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Không thể tạo tài khoản');
            }

            alert('✅ Tạo tài khoản nhân viên thành công!');
            setShowAddModal(false);
            setNewStaff({
                username: '',
                password: '',
                fullName: '',
                email: '',
                phone: '',
                role: 'STAFF'
            });
            fetchStaff();
        } catch (err) {
            console.error('Lỗi khi tạo nhân viên:', err);
            alert('❌ ' + err.message);
        }
    };

    // ✅ Xóa nhân viên
    const handleDeleteStaff = async (staffId) => {
        const staffMember = staff.find((s) => s.id === staffId);
        if (!window.confirm(`Bạn có chắc muốn xóa nhân viên "${staffMember.fullName}"?`)) return;

        try {
            const token = localStorage.getItem('admin_token');
            // BE mới không có DELETE user - dùng PATCH toggle để vô hiệu hóa
            const res = await fetch(`https://chuyen-de-asp.onrender.com/api/auth/users/${staffId}/toggle`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Không thể vô hiệu hóa tài khoản');

            // Cập nhật trạng thái isActive trong UI
            setStaff(staff.map((s) => s.id === staffId ? { ...s, isActive: !s.isActive } : s));
            if (selectedStaff?.id === staffId) {
                setSelectedStaff(prev => ({ ...prev, isActive: !prev.isActive }));
            }
            alert('✅ Đã thay đổi trạng thái tài khoản nhân viên');
        } catch (err) {
            console.error('Lỗi khi xóa nhân viên:', err);
            alert('❌ Không thể xóa nhân viên.');
        }
    };

    const filteredStaff = staff.filter((s) => {
        const matchSearch =
            s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchRole = roleFilter === 'Tất cả' || s.role === roleFilter;
        return matchSearch && matchRole;
    });

    const stats = {
        total: staff.length,
        admin: staff.filter((s) => s.role === 'ADMIN').length,
        employee: staff.filter((s) => s.role === 'EMPLOYEE').length,
        staff: staff.filter((s) => s.role === 'STAFF').length,
    };

    if (loading) return <div className="p-6 text-gray-400">Đang tải danh sách nhân viên...</div>;
    if (error) return <div className="p-6 text-red-500">{error}</div>;

    return (
        <div className="p-6">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Quản Lý Nhân Viên</h1>
                    <p className="text-gray-400">Quản lý tài khoản và phân quyền nhân viên</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Thêm Nhân Viên
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Tổng nhân viên</div>
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="text-red-400 text-sm mb-1">Quản trị viên</div>
                    <div className="text-2xl font-bold text-red-400">{stats.admin}</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="text-blue-400 text-sm mb-1">Nhân viên</div>
                    <div className="text-2xl font-bold text-blue-400">{stats.employee}</div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="text-green-400 text-sm mb-1">Thu ngân</div>
                    <div className="text-2xl font-bold text-green-400">{stats.staff}</div>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên, username, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 text-white pl-12 pr-4 py-3 rounded-lg border border-gray-700 focus:border-amber-500 outline-none"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-amber-500 outline-none"
                >
                    {roleOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {/* Staff Table */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-900">
                            <tr>
                                <th className="px-6 py-4 text-left text-white font-semibold">Nhân viên</th>
                                <th className="px-6 py-4 text-left text-white font-semibold">Liên hệ</th>
                                <th className="px-6 py-4 text-left text-white font-semibold">Chức vụ</th>
                                <th className="px-6 py-4 text-left text-white font-semibold">Ngày tham gia</th>
                                <th className="px-6 py-4 text-center text-white font-semibold">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {filteredStaff.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                        Không tìm thấy nhân viên nào
                                    </td>
                                </tr>
                            ) : (
                                filteredStaff.map((s) => {
                                    const roleBadge = getRoleBadge(s.role);
                                    return (
                                        <tr key={s.id} className="hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                                        {s.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-medium">{s.fullName}</div>
                                                        <div className="text-gray-400 text-sm">@{s.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-white text-sm">{s.email}</div>
                                                <div className="text-gray-400 text-sm">{s.phone}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${roleBadge.bg} ${roleBadge.text}`}>
                                                    {roleBadge.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-300">
                                                {s.createdAt}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleViewDetail(s)}
                                                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteStaff(s.id)}
                                                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Thêm Nhân Viên */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full">
                        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white">Thêm Nhân Viên Mới</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddStaff} className="p-6 space-y-4">
                            <div>
                                <label className="block text-white font-medium mb-2">Username *</label>
                                <input
                                    type="text"
                                    required
                                    value={newStaff.username}
                                    onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                                    className="w-full bg-gray-900 text-white px-4 py-2 rounded border border-gray-700 focus:border-amber-500 outline-none"
                                    placeholder="username"
                                />
                            </div>

                            <div>
                                <label className="block text-white font-medium mb-2">Mật khẩu *</label>
                                <input
                                    type="password"
                                    required
                                    value={newStaff.password}
                                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                    className="w-full bg-gray-900 text-white px-4 py-2 rounded border border-gray-700 focus:border-amber-500 outline-none"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-white font-medium mb-2">Họ tên *</label>
                                <input
                                    type="text"
                                    required
                                    value={newStaff.fullName}
                                    onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                                    className="w-full bg-gray-900 text-white px-4 py-2 rounded border border-gray-700 focus:border-amber-500 outline-none"
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>

                            <div>
                                <label className="block text-white font-medium mb-2">Email</label>
                                <input
                                    type="email"
                                    value={newStaff.email}
                                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                    className="w-full bg-gray-900 text-white px-4 py-2 rounded border border-gray-700 focus:border-amber-500 outline-none"
                                    placeholder="email@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-white font-medium mb-2">Số điện thoại</label>
                                <input
                                    type="tel"
                                    value={newStaff.phone}
                                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                                    className="w-full bg-gray-900 text-white px-4 py-2 rounded border border-gray-700 focus:border-amber-500 outline-none"
                                    placeholder="0123456789"
                                />
                            </div>

                            <div>
                                <label className="block text-white font-medium mb-2">Chức vụ *</label>
                                <select
                                    value={newStaff.role}
                                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                                    className="w-full bg-gray-900 text-white px-4 py-2 rounded border border-gray-700 focus:border-amber-500 outline-none"
                                >
                                    <option value="STAFF">Thu ngân</option>
                                    <option value="EMPLOYEE">Nhân viên</option>
                                    <option value="ADMIN">Quản trị viên</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-medium transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded font-medium transition-colors"
                                >
                                    Tạo tài khoản
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Chi Tiết Nhân Viên */}
            {showDetailModal && selectedStaff && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white">Thông Tin Nhân Viên</h2>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                                    {selectedStaff.fullName.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">{selectedStaff.fullName}</h3>
                                    <p className="text-gray-400">@{selectedStaff.username}</p>
                                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getRoleBadge(selectedStaff.role).bg} ${getRoleBadge(selectedStaff.role).text}`}>
                                        {getRoleBadge(selectedStaff.role).label}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-gray-900 rounded-lg p-4 space-y-3">
                                <h4 className="text-white font-bold mb-3">Thông Tin Liên Hệ</h4>
                                <div className="flex items-center gap-3 text-gray-300">
                                    <Mail className="w-5 h-5 text-blue-500" />
                                    <span>{selectedStaff.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-300">
                                    <Phone className="w-5 h-5 text-blue-500" />
                                    <span>{selectedStaff.phone}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-300">
                                    <Shield className="w-5 h-5 text-blue-500" />
                                    <span>Tham gia: {selectedStaff.createdAt}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminStaff;