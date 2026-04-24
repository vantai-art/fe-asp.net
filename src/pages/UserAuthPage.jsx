// src/pages/UserAuthPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Lock, User, Eye, EyeOff, Loader, AlertCircle } from 'lucide-react';

function UserAuthPage() {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Login state
    const [loginData, setLoginData] = useState({ username: '', password: '' });
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    // Register state - chỉ giữ field BE có
    const [registerData, setRegisterData] = useState({
        username: '',
        fullName: '',
        password: '',
        confirmPassword: ''
    });
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Handle Login
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
                    username: loginData.username,
                    password: loginData.password
                })
            });

            const contentType = response.headers.get('content-type');
            const data = contentType?.includes('application/json')
                ? await response.json()
                : await response.text();

            if (!response.ok) {
                throw new Error(typeof data === 'string' ? data : data.message || 'Đăng nhập thất bại');
            }

            localStorage.setItem('user_token', data.token || data.Token);
            localStorage.setItem('user_user', JSON.stringify({
                id: data.userId || data.UserId,
                username: data.username || data.Username,
                role: data.role || data.Role,
                fullName: data.fullName || data.FullName
            }));

            setSuccess('✅ Đăng nhập thành công!');
            setTimeout(() => {
                navigate('/');
                window.location.reload();
            }, 1000);

        } catch (err) {
            setError(err.message || 'Username hoặc mật khẩu không đúng!');
        } finally {
            setLoading(false);
        }
    };

    // Handle Register
    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!registerData.username.trim()) {
            setError('❌ Vui lòng nhập tên đăng nhập!');
            return;
        }
        if (registerData.password.length < 6) {
            setError('❌ Mật khẩu phải ít nhất 6 ký tự!');
            return;
        }
        if (registerData.password !== registerData.confirmPassword) {
            setError('❌ Mật khẩu không trùng khớp!');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('https://chuyen-de-asp.onrender.com/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: registerData.username,
                    password: registerData.password,
                    fullName: registerData.fullName || null
                    // Bỏ email, phone vì BE (User model) không có field này
                })
            });

            const contentType = response.headers.get('content-type');
            const data = contentType?.includes('application/json')
                ? await response.json()
                : await response.text();

            if (!response.ok) {
                throw new Error(typeof data === 'string' ? data : data.message || 'Đăng ký thất bại');
            }

            setSuccess('✅ Đăng ký thành công! Vui lòng đăng nhập.');
            const savedUsername = registerData.username;
            setRegisterData({ username: '', fullName: '', password: '', confirmPassword: '' });

            setTimeout(() => {
                setIsLogin(true);
                setLoginData({ username: savedUsername, password: '' });
                setSuccess('');
            }, 1500);

        } catch (err) {
            setError(err.message || 'Lỗi khi đăng ký!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-600 rounded-full mb-4">
                        <Coffee className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">COFFEE BLEND</h1>
                    <p className="text-gray-400">{isLogin ? 'Đăng Nhập' : 'Đăng Ký'}</p>
                </div>

                {/* Form Container */}
                <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
                    {error && (
                        <div className="mb-4 bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg">
                            <span className="text-sm">{success}</span>
                        </div>
                    )}

                    {isLogin ? (
                        // LOGIN FORM
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-gray-300 mb-2 font-medium text-sm">
                                    <User className="w-4 h-4 inline mr-2" />
                                    Tên Đăng Nhập
                                </label>
                                <input
                                    type="text"
                                    value={loginData.username}
                                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                    placeholder="Nhập tên đăng nhập"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 mb-2 font-medium text-sm">
                                    <Lock className="w-4 h-4 inline mr-2" />
                                    Mật Khẩu
                                </label>
                                <div className="relative">
                                    <input
                                        type={showLoginPassword ? 'text' : 'password'}
                                        value={loginData.password}
                                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                        placeholder="Nhập mật khẩu"
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                                        disabled={loading}
                                    >
                                        {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? <><Loader className="w-5 h-5 animate-spin" />Đang đăng nhập...</> : 'Đăng Nhập'}
                            </button>
                        </form>
                    ) : (
                        // REGISTER FORM - chỉ còn username, fullName, password
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 mb-2 font-medium text-sm">
                                    <User className="w-4 h-4 inline mr-2" />
                                    Tên Đăng Nhập *
                                </label>
                                <input
                                    type="text"
                                    value={registerData.username}
                                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                    placeholder="Nhập tên đăng nhập (ít nhất 3 ký tự)"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 mb-2 font-medium text-sm">
                                    <User className="w-4 h-4 inline mr-2" />
                                    Tên Đầy Đủ
                                </label>
                                <input
                                    type="text"
                                    value={registerData.fullName}
                                    onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                    placeholder="Nhập tên đầy đủ (không bắt buộc)"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 mb-2 font-medium text-sm">
                                    <Lock className="w-4 h-4 inline mr-2" />
                                    Mật Khẩu *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showRegisterPassword ? 'text' : 'password'}
                                        value={registerData.password}
                                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                        placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                        className="absolute right-3 top-2 text-gray-400 hover:text-gray-300"
                                        disabled={loading}
                                    >
                                        {showRegisterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-300 mb-2 font-medium text-sm">
                                    <Lock className="w-4 h-4 inline mr-2" />
                                    Xác Nhận Mật Khẩu *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={registerData.confirmPassword}
                                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                        placeholder="Nhập lại mật khẩu"
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-2 text-gray-400 hover:text-gray-300"
                                        disabled={loading}
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? <><Loader className="w-5 h-5 animate-spin" />Đang đăng ký...</> : 'Đăng Ký'}
                            </button>
                        </form>
                    )}

                    {/* Toggle Login/Register */}
                    <div className="mt-6 pt-6 border-t border-gray-700 text-center">
                        <p className="text-gray-400 text-sm mb-3">
                            {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                        </p>
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
                            className="text-amber-500 hover:text-amber-400 font-semibold text-sm"
                            disabled={loading}
                        >
                            {isLogin ? 'Đăng Ký Ngay' : 'Đăng Nhập'}
                        </button>
                    </div>
                </div>

                {/* Back Link */}
                <div className="text-center mt-6">
                    <button
                        onClick={() => navigate('/')}
                        className="text-gray-400 hover:text-amber-500 text-sm"
                    >
                        ← Quay lại trang chủ
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UserAuthPage;