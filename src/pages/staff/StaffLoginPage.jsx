// src/pages/staff/StaffLoginPage.jsx
import React, { useState, useEffect } from 'react';
import { Coffee, Eye, EyeOff, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function StaffLoginPage() {
    const navigate = useNavigate();
    const [credential, setCredential] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // 🧭 Nếu đã đăng nhập rồi thì tự chuyển sang /staff
    useEffect(() => {
        const token = localStorage.getItem('staff_token');
        const role = localStorage.getItem('staff_role');
        if (token && role && ['STAFF', 'EMPLOYEE', 'ADMIN'].includes(role)) {
            navigate('/staff', { replace: true });
        }
    }, [navigate]);


    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await fetch('https://chuyen-de-asp.onrender.com/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: credential,
                    password: password
                })
            });

            const data = await response.json();

            console.log('📦 Full API Response:', data);
            console.log('📦 Response structure:', Object.keys(data));
            console.log('👤 User object:', data.user);
            console.log('👤 User role:', data.user?.role);
            console.log('👤 Direct role:', data.role);

            if (!response.ok) {
                throw new Error(data.message || 'Đăng nhập thất bại');
            }

            let userRole = null;
            let userData = null;
            let token = null;

            if (data.user && data.user.role) {
                userRole = data.user.role;
                userData = data.user;
                token = data.token;
            } else if (data.role) {
                userRole = data.role;
                userData = data;
                token = data.token;
            } else if (data.data && data.data.user && data.data.user.role) {
                userRole = data.data.user.role;
                userData = data.data.user;
                token = data.data.token || data.token;
            }

            console.log('🎯 Extracted data:');
            console.log('  - Token:', !!token);
            console.log('  - User:', userData);
            console.log('  - Role:', userRole);

            if (!token) throw new Error('Không nhận được token từ server');
            if (!userRole) throw new Error('Không nhận được thông tin role từ server.');

            const allowedRoles = ['STAFF', 'EMPLOYEE', 'ADMIN'];
            if (!allowedRoles.includes(userRole.toUpperCase())) {
                setError(`❌ Chỉ nhân viên (STAFF/EMPLOYEE) và ADMIN mới được đăng nhập! Role hiện tại: ${userRole}`);
                setLoading(false);
                return;
            }

            // 💾 Lưu localStorage
            localStorage.setItem('staff_token', token);
            localStorage.setItem('staff_user', JSON.stringify(userData));
            localStorage.setItem('staff_role', userRole.toUpperCase());

            console.log('💾 Saved to localStorage:');
            console.log('  - Token:', !!token);
            console.log('  - User:', userData);
            console.log('  - Role:', userRole.toUpperCase());

            setSuccess(`✅ Đăng nhập thành công với role ${userRole}!`);
            navigate('/staff', { replace: true }); // ⚡ chuyển hướng ngay, không cần setTimeout
        } catch (err) {
            console.error('❌ Login error:', err);
            setError(err.message || 'Lỗi kết nối đến server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-900 via-gray-900 to-black flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Coffee className="w-12 h-12 text-amber-500" />
                        <h1 className="text-4xl font-bold text-white">FOOD AND DRINK</h1>
                    </div>
                    <p className="text-amber-200 text-lg font-semibold">Staff Login</p>
                    <p className="text-gray-400 text-sm mt-1">Đăng nhập cho nhân viên</p>
                </div>

                {/* Form */}
                <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-white font-semibold mb-2 text-sm">
                                Tên đăng nhập hoặc Email
                            </label>
                            <input
                                type="text"
                                value={credential}
                                onChange={(e) => setCredential(e.target.value)}
                                placeholder="nhập tên đăng nhập hoặc email"
                                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-white font-semibold mb-2 text-sm">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu"
                                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                                    disabled={loading}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-900/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-900/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg text-sm">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Đang đăng nhập...
                                </>
                            ) : (
                                'Đăng Nhập'
                            )}
                        </button>
                    </form>
                </div>

                <div className="text-center mt-6 p-4 bg-amber-900/20 border border-amber-600 rounded-lg">
                    <p className="text-amber-200 text-sm">
                        💼 Đây là trang đăng nhập <strong>dành riêng cho nhân viên</strong>
                    </p>
                    <p className="text-gray-400 text-xs mt-2">
                        Cho phép role: STAFF, EMPLOYEE, ADMIN
                    </p>
                </div>

                <div className="text-center mt-4">
                    <button
                        onClick={() => navigate('/')}
                        className="text-gray-400 hover:text-gray-200 text-sm transition-colors"
                    >
                        ← Quay lại trang chủ
                    </button>
                </div>
            </div>
        </div>
    );
}

export default StaffLoginPage;
