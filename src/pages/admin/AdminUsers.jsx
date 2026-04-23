import React, { useState, useEffect } from 'react';
import { Search, Eye, Trash2, User, Mail, Phone, ShoppingBag, X } from 'lucide-react';

function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tất cả');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const statusOptions = [
        { value: 'Tất cả', label: 'Tất cả' },
        { value: 'active', label: 'Hoạt động' },
        { value: 'vip', label: 'VIP' },
        { value: 'inactive', label: 'Không hoạt động' }
    ];

    // ✅ Gọi API để lấy danh sách người dùng
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('admin_token');
                const res = await fetch('https://chuyen-de-asp.onrender.com/api/auth/users', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!res.ok) throw new Error('Không thể tải danh sách người dùng');
                const data = await res.json();

                // ✅ CHỈ LẤY USERS CÓ ROLE = USER
                const customersOnly = data.filter(u => u.role === 'USER');

                const mapped = customersOnly.map((u) => ({
                    id: u.id,
                    name: u.fullName || u.username || 'Không rõ',
                    email: u.email || 'Chưa có email',
                    phone: u.phone || 'N/A',
                    address: u.address || 'Không có địa chỉ',
                    totalOrders: u.totalOrders || 0,
                    totalSpent: u.totalSpent || 0,
                    status: u.status || 'active',
                    joinDate: u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString('vi-VN')
                        : 'N/A',
                }));
                setUsers(mapped);
            } catch (err) {
                console.error(err);
                setError('Không thể tải dữ liệu người dùng');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Hoạt động' };
            case 'vip':
                return { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'VIP' };
            case 'inactive':
                return { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Không hoạt động' };
            default:
                return { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Khác' };
        }
    };

    const handleViewDetail = (user) => {
        setSelectedUser(user);
        setShowDetailModal(true);
    };

    // ✅ Xóa user trong DB
    const handleDeleteUser = async (userId) => {
        const user = users.find((u) => u.id === userId);
        if (!window.confirm(`Bạn có chắc muốn xóa khách hàng "${user.name}"?`)) return;

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`https://chuyen-de-asp.onrender.com/api/auth/users/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Không thể xóa người dùng');
            setUsers(users.filter((u) => u.id !== userId));
            if (selectedUser?.id === userId) {
                setShowDetailModal(false);
                setSelectedUser(null);
            }
        } catch (err) {
            console.error('Lỗi khi xóa người dùng:', err);
            alert('Không thể xóa người dùng.');
        }
    };

    // ✅ Cập nhật trạng thái trong DB
    const handleUpdateStatus = async (userId, newStatus) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`https://chuyen-de-asp.onrender.com/api/auth/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error('Không thể cập nhật trạng thái');
            setUsers(users.map((u) =>
                u.id === userId ? { ...u, status: newStatus } : u
            ));
            if (selectedUser?.id === userId) {
                setSelectedUser({ ...selectedUser, status: newStatus });
            }
        } catch (err) {
            console.error('Lỗi khi cập nhật trạng thái:', err);
            alert('Không thể cập nhật trạng thái người dùng.');
        }
    };

    const filteredUsers = users.filter((user) => {
        const matchSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phone.includes(searchTerm);
        const matchStatus = statusFilter === 'Tất cả' || user.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const stats = {
        total: users.length,
        active: users.filter((u) => u.status === 'active').length,
        vip: users.filter((u) => u.status === 'vip').length,
        inactive: users.filter((u) => u.status === 'inactive').length,
    };

    if (loading) return <div className="p-6 text-gray-400">Đang tải danh sách người dùng...</div>;
    if (error) return <div className="p-6 text-red-500">{error}</div>;

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Quản Lý Khách Hàng</h1>
                <p className="text-gray-400">Quản lý thông tin khách hàng và lịch sử mua hàng</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Tổng khách hàng</div>
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="text-green-400 text-sm mb-1">Hoạt động</div>
                    <div className="text-2xl font-bold text-green-400">{stats.active}</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                    <div className="text-amber-400 text-sm mb-1">VIP</div>
                    <div className="text-2xl font-bold text-amber-400">{stats.vip}</div>
                </div>
                <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Không hoạt động</div>
                    <div className="text-2xl font-bold text-gray-400">{stats.inactive}</div>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên, email, số điện thoại..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 text-white pl-12 pr-4 py-3 rounded-lg border border-gray-700 focus:border-amber-500 outline-none"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-amber-500 outline-none"
                >
                    {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {/* Users Table */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-900">
                            <tr>
                                <th className="px-6 py-4 text-left text-white font-semibold">Khách hàng</th>
                                <th className="px-6 py-4 text-left text-white font-semibold">Liên hệ</th>
                                <th className="px-6 py-4 text-left text-white font-semibold">Đơn hàng</th>
                                <th className="px-6 py-4 text-left text-white font-semibold">Tổng chi tiêu</th>
                                <th className="px-6 py-4 text-left text-white font-semibold">Trạng thái</th>
                                <th className="px-6 py-4 text-center text-white font-semibold">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                        Không tìm thấy khách hàng nào
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const statusBadge = getStatusBadge(user.status);
                                    return (
                                        <tr key={user.id} className="hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-medium">{user.name}</div>
                                                        <div className="text-gray-400 text-sm">Tham gia: {user.joinDate}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-white text-sm">{user.email}</div>
                                                <div className="text-gray-400 text-sm">{user.phone}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-white font-bold">{user.totalOrders}</div>
                                                <div className="text-gray-400 text-sm">đơn hàng</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-amber-500 font-bold">
                                                    {user.totalSpent.toLocaleString('vi-VN')}đ
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                                                    {statusBadge.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleViewDetail(user)}
                                                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
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

            {/* Modal chi tiết người dùng giữ nguyên */}
            {showDetailModal && selectedUser && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white">Thông Tin Khách Hàng</h2>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                                    {selectedUser.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">{selectedUser.name}</h3>
                                    <p className="text-gray-400">Tham gia: {selectedUser.joinDate}</p>
                                </div>
                            </div>

                            <div className="bg-gray-900 rounded-lg p-4 space-y-3">
                                <h4 className="text-white font-bold mb-3">Thông Tin Liên Hệ</h4>
                                <div className="flex items-center gap-3 text-gray-300">
                                    <Mail className="w-5 h-5 text-amber-500" />
                                    <span>{selectedUser.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-300">
                                    <Phone className="w-5 h-5 text-amber-500" />
                                    <span>{selectedUser.phone}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-300">
                                    <User className="w-5 h-5 text-amber-500" />
                                    <span>{selectedUser.address}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-900 rounded-lg p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <ShoppingBag className="w-5 h-5 text-blue-400" />
                                        <span className="text-gray-400">Tổng đơn hàng</span>
                                    </div>
                                    <div className="text-2xl font-bold text-white">{selectedUser.totalOrders}</div>
                                </div>
                                <div className="bg-gray-900 rounded-lg p-4">
                                    <div className="text-gray-400 mb-2">Tổng chi tiêu</div>
                                    <div className="text-2xl font-bold text-amber-500">
                                        {selectedUser.totalSpent.toLocaleString('vi-VN')}đ
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-white font-bold mb-3">Cập Nhật Trạng Thái</h4>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleUpdateStatus(selectedUser.id, 'active')}
                                        className={`flex-1 py-2 rounded font-medium ${selectedUser.status === 'active'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        Hoạt động
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedUser.id, 'vip')}
                                        className={`flex-1 py-2 rounded font-medium ${selectedUser.status === 'vip'
                                            ? 'bg-amber-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        VIP
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedUser.id, 'inactive')}
                                        className={`flex-1 py-2 rounded font-medium ${selectedUser.status === 'inactive'
                                            ? 'bg-gray-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        Không hoạt động
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminUsers;
