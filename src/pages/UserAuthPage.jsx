// src/pages/UserAuthPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Mail, Lock, User, Phone, Eye, EyeOff, Loader, AlertCircle } from 'lucide-react';

function UserAuthPage() {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [loginData, setLoginData] = useState({ username: '', password: '' });
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    const [registerData, setRegisterData] = useState({
        username: '',
        email: '',
        fullName: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // ─── LOGIN ───────────────────────────────────────────
    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);
        try {
            const res = await fetch('https://chuyen-de-asp.onrender.com/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: loginData.username, password: loginData.password })
            });
            const ct = res.headers.get('content-type');
            const data = ct?.includes('application/json') ? await res.json() : await res.text();
            if (!res.ok) throw new Error(typeof data === 'string' ? data : data.message || 'Đăng nhập thất bại');

            localStorage.setItem('user_token', data.token || data.Token);
            localStorage.setItem('user_user', JSON.stringify({
                id: data.userId || data.UserId,
                username: data.username || data.Username,
                role: data.role || data.Role,
                fullName: data.fullName || data.FullName,
                email: data.email || data.Email,
                phone: data.phone || data.Phone,
            }));
            setSuccess('✅ Đăng nhập thành công!');
            setTimeout(() => { navigate('/'); window.location.reload(); }, 1000);
        } catch (err) {
            setError(err.message || 'Username hoặc mật khẩu không đúng!');
        } finally { setLoading(false); }
    };

    // ─── REGISTER ────────────────────────────────────────
    const handleRegister = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!registerData.username.trim()) { setError('❌ Vui lòng nhập tên đăng nhập!'); return; }
        if (registerData.password.length < 6) { setError('❌ Mật khẩu phải ít nhất 6 ký tự!'); return; }
        if (registerData.password !== registerData.confirmPassword) { setError('❌ Mật khẩu không trùng khớp!'); return; }
        setLoading(true);
        try {
            const res = await fetch('https://chuyen-de-asp.onrender.com/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: registerData.username,
                    password: registerData.password,
                    fullName: registerData.fullName || null,
                    // email & phone: bỏ qua cho đến khi migration chạy xong trên DB
                })
            });
            const ct = res.headers.get('content-type');
            const data = ct?.includes('application/json') ? await res.json() : await res.text();
            if (!res.ok) throw new Error(typeof data === 'string' ? data : data.message || 'Đăng ký thất bại');

            setSuccess('✅ Đăng ký thành công! Vui lòng đăng nhập.');
            const savedUsername = registerData.username;
            setRegisterData({ username: '', email: '', fullName: '', phone: '', password: '', confirmPassword: '' });
            setTimeout(() => { setIsLogin(true); setLoginData({ username: savedUsername, password: '' }); setSuccess(''); }, 1500);
        } catch (err) {
            setError(err.message || 'Lỗi khi đăng ký!');
        } finally { setLoading(false); }
    };

    const inputClass = "w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50";
    const labelClass = "block text-gray-300 mb-2 font-medium text-sm";

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-600 rounded-full mb-4">
                        <Coffee className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">COFFEE BLEND</h1>
                    <p className="text-gray-400">{isLogin ? 'Đăng Nhập' : 'Tạo Tài Khoản'}</p>
                </div>

                <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
                    {/* Alerts */}
                    {error && (
                        <div className="mb-4 bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm">
                            {success}
                        </div>
                    )}

                    {isLogin ? (
                        /* ── LOGIN FORM ── */
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className={labelClass}><User className="w-4 h-4 inline mr-2" />Tên Đăng Nhập</label>
                                <input
                                    type="text"
                                    value={loginData.username}
                                    onChange={e => setLoginData({ ...loginData, username: e.target.value })}
                                    className={inputClass + " py-3"}
                                    placeholder="Nhập tên đăng nhập"
                                    required disabled={loading}
                                />
                            </div>
                            <div>
                                <label className={labelClass}><Lock className="w-4 h-4 inline mr-2" />Mật Khẩu</label>
                                <div className="relative">
                                    <input
                                        type={showLoginPassword ? 'text' : 'password'}
                                        value={loginData.password}
                                        onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                                        className={inputClass + " py-3 pr-10"}
                                        placeholder="Nhập mật khẩu"
                                        required disabled={loading}
                                    />
                                    <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-300" disabled={loading}>
                                        {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                                {loading ? <><Loader className="w-5 h-5 animate-spin" />Đang đăng nhập...</> : 'Đăng Nhập'}
                            </button>
                        </form>
                    ) : (
                        /* ── REGISTER FORM ── */
                        <form onSubmit={handleRegister} className="space-y-4">
                            {/* Username */}
                            <div>
                                <label className={labelClass}><User className="w-4 h-4 inline mr-2" />Tên Đăng Nhập *</label>
                                <input
                                    type="text"
                                    value={registerData.username}
                                    onChange={e => setRegisterData({ ...registerData, username: e.target.value })}
                                    className={inputClass}
                                    placeholder="Ít nhất 3 ký tự"
                                    required disabled={loading}
                                />
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className={labelClass}><User className="w-4 h-4 inline mr-2" />Tên Đầy Đủ</label>
                                <input
                                    type="text"
                                    value={registerData.fullName}
                                    onChange={e => setRegisterData({ ...registerData, fullName: e.target.value })}
                                    className={inputClass}
                                    placeholder="Nhập tên đầy đủ"
                                    disabled={loading}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className={labelClass}><Mail className="w-4 h-4 inline mr-2" />Email</label>
                                <input
                                    type="email"
                                    value={registerData.email}
                                    onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
                                    className={inputClass}
                                    placeholder="example@email.com"
                                    disabled={loading}
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className={labelClass}><Phone className="w-4 h-4 inline mr-2" />Số Điện Thoại</label>
                                <input
                                    type="tel"
                                    value={registerData.phone}
                                    onChange={e => setRegisterData({ ...registerData, phone: e.target.value })}
                                    className={inputClass}
                                    placeholder="0xxxxxxxxx"
                                    disabled={loading}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className={labelClass}><Lock className="w-4 h-4 inline mr-2" />Mật Khẩu *</label>
                                <div className="relative">
                                    <input
                                        type={showRegisterPassword ? 'text' : 'password'}
                                        value={registerData.password}
                                        onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
                                        className={inputClass + " pr-10"}
                                        placeholder="Ít nhất 6 ký tự"
                                        required disabled={loading}
                                    />
                                    <button type="button" onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                        className="absolute right-3 top-2 text-gray-400 hover:text-gray-300" disabled={loading}>
                                        {showRegisterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className={labelClass}><Lock className="w-4 h-4 inline mr-2" />Xác Nhận Mật Khẩu *</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={registerData.confirmPassword}
                                        onChange={e => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                                        className={inputClass + " pr-10"}
                                        placeholder="Nhập lại mật khẩu"
                                        required disabled={loading}
                                    />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-2 text-gray-400 hover:text-gray-300" disabled={loading}>
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2">
                                {loading ? <><Loader className="w-5 h-5 animate-spin" />Đang đăng ký...</> : 'Đăng Ký'}
                            </button>
                        </form>
                    )}

                    {/* Toggle */}
                    <div className="mt-6 pt-6 border-t border-gray-700 text-center">
                        <p className="text-gray-400 text-sm mb-2">
                            {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                        </p>
                        <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
                            className="text-amber-500 hover:text-amber-400 font-semibold text-sm" disabled={loading}>
                            {isLogin ? 'Đăng Ký Ngay' : 'Đăng Nhập'}
                        </button>
                    </div>
                </div>

                <div className="text-center mt-6">
                    <button onClick={() => navigate('/')} className="text-gray-400 hover:text-amber-500 text-sm">
                        ← Quay lại trang chủ
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UserAuthPage;