// ==================== 2. src/components/Header.jsx - UPDATED ====================
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Coffee, ShoppingCart, User, Menu, X, LogOut, ClipboardList } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import CartSidebar from './CartSidebar';

function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const { cart } = useAppContext();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showCart, setShowCart] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const userToken = localStorage.getItem('user_token');
        const userUser = localStorage.getItem('user_user');
        let user = null;

        if (userToken && userUser) {
            try {
                user = JSON.parse(userUser);
            } catch (e) {
                console.error('Lỗi parse user:', e);
            }
        }

        setCurrentUser(user);
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.clear();
        setCurrentUser(null);
        navigate('/');
        window.location.reload();
    };

    const navLinks = [
        { path: '/', label: 'TRANG CHỦ' },
        { path: '/menu', label: 'THỰC ĐƠN' },
        { path: '/shop', label: 'CỬA HÀNG' },
    ];

    return (
        <>
            <header className="fixed top-0 left-0 right-0 bg-black/95 backdrop-blur-sm z-50 border-b border-gray-800">
                <div className="container mx-auto px-6">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-3 group">
                            <Coffee className="w-8 h-8 text-amber-500 group-hover:text-amber-400 transition-colors" />
                            <span className="text-2xl font-bold text-white">COFFEE BLEND</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`text-sm font-semibold transition-colors ${location.pathname === link.path
                                        ? 'text-amber-500'
                                        : 'text-gray-300 hover:text-amber-500'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        {/* Right Side */}
                        <div className="hidden lg:flex items-center gap-4">
                            {/* Cart */}
                            <button
                                onClick={() => setShowCart(true)}
                                className="relative p-2 text-gray-300 hover:text-amber-500 transition-colors"
                            >
                                <ShoppingCart className="w-6 h-6" />
                                {cart.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {cart.length}
                                    </span>
                                )}
                            </button>

                            {/* User menu */}
                            {currentUser ? (
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
                                        <User className="w-4 h-4 text-amber-500" />
                                        <span className="text-white text-sm font-medium">
                                            {currentUser.username || currentUser.fullName || 'User'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span className="text-sm font-medium">Đăng Xuất</span>
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    to="/auth"
                                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg transition-colors"
                                >
                                    <User className="w-4 h-4" />
                                    <span className="font-medium">Đăng Nhập</span>
                                </Link>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 text-gray-300 hover:text-amber-500 transition-colors"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>

                    {/* 🔥 Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden py-4 border-t border-gray-800">
                            <nav className="flex flex-col gap-4">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`text-sm font-semibold transition-colors ${location.pathname === link.path
                                            ? 'text-amber-500'
                                            : 'text-gray-300 hover:text-amber-500'
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}

                                {currentUser && (
                                    <Link
                                        to="/my-orders"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`text-sm font-semibold transition-colors flex items-center gap-2 ${location.pathname === '/my-orders'
                                            ? 'text-amber-500'
                                            : 'text-gray-300 hover:text-amber-500'
                                            }`}
                                    >
                                        <ClipboardList className="w-4 h-4" />
                                        ĐƠN HÀNG CỦA TÔI
                                    </Link>
                                )}

                                <button
                                    onClick={() => {
                                        setShowCart(true);
                                        setMobileMenuOpen(false);
                                    }}
                                    className="text-left text-sm font-semibold text-gray-300 hover:text-amber-500 flex items-center gap-2"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    GIỎ HÀNG ({cart.length})
                                </button>

                                {currentUser ? (
                                    <button
                                        onClick={handleLogout}
                                        className="text-left text-sm font-semibold text-red-400 hover:text-red-300 flex items-center gap-2"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        ĐĂNG XUẤT
                                    </button>
                                ) : (
                                    <Link
                                        to="/auth"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-sm font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-2"
                                    >
                                        <User className="w-4 h-4" />
                                        ĐĂNG NHẬP
                                    </Link>
                                )}
                            </nav>
                        </div>
                    )}
                </div>
            </header>

            {/* Cart Sidebar */}
            {showCart && <CartSidebar onClose={() => setShowCart(false)} />}

            {/* Overlay */}
            {showCart && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => setShowCart(false)}
                />
            )}
        </>
    );
}

export default Header;
