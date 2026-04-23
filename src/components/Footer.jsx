import React from 'react';
import { Coffee, Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

function Footer() {
    return (
        <footer className="bg-gray-900 border-t border-gray-800 text-gray-300">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Về Chúng Tôi */}
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                            <Coffee className="w-8 h-8 text-amber-500" />
                            <div>
                                <div className="text-xl font-bold text-white">COFFEE BLEND</div>
                                <div className="text-xs tracking-widest text-gray-400">PREMIUM COFFEE</div>
                            </div>
                        </div>
                        <p className="text-sm leading-relaxed mb-4">
                            Nơi hương vị cà phê hoà quyện cùng không gian thư giãn.
                            Chúng tôi tự hào mang đến những trải nghiệm tuyệt vời nhất cho khách hàng.
                        </p>
                        <div className="flex gap-3">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                                className="bg-gray-800 hover:bg-amber-600 p-2 rounded transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                                className="bg-gray-800 hover:bg-amber-600 p-2 rounded transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                                className="bg-gray-800 hover:bg-amber-600 p-2 rounded transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
                                className="bg-gray-800 hover:bg-amber-600 p-2 rounded transition-colors">
                                <Youtube className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Liên Kết Nhanh */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Liên Kết Nhanh</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-amber-500 transition-colors">Trang Chủ</a></li>
                            <li><a href="#" className="hover:text-amber-500 transition-colors">Thực Đơn</a></li>
                            <li><a href="#" className="hover:text-amber-500 transition-colors">Giới Thiệu</a></li>
                            <li><a href="#" className="hover:text-amber-500 transition-colors">Tin Tức</a></li>
                            <li><a href="#" className="hover:text-amber-500 transition-colors">Liên Hệ</a></li>
                            <li><a href="#" className="hover:text-amber-500 transition-colors">Tuyển Dụng</a></li>
                        </ul>
                    </div>

                    {/* Chính Sách */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Chính Sách</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-amber-500 transition-colors">Chính Sách Bảo Mật</a></li>
                            <li><a href="#" className="hover:text-amber-500 transition-colors">Điều Khoản Sử Dụng</a></li>
                            <li><a href="#" className="hover:text-amber-500 transition-colors">Chính Sách Đổi Trả</a></li>
                            <li><a href="#" className="hover:text-amber-500 transition-colors">Phương Thức Thanh Toán</a></li>
                            <li><a href="#" className="hover:text-amber-500 transition-colors">Vận Chuyển & Giao Hàng</a></li>
                        </ul>
                    </div>

                    {/* Liên Hệ */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Liên Hệ</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <span>2/60, Thủ Đức, TP.HCM</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                <a href="tel:0328778198" className="hover:text-amber-500 transition-colors">
                                    0328778198
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                <a href="mailto:contact@coffeeblend.vn" className="hover:text-amber-500 transition-colors">
                                    contact@coffeeblend.vn
                                </a>
                            </li>
                        </ul>
                        <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                            <p className="text-white font-semibold mb-2">Giờ Mở Cửa</p>
                            <p className="text-sm">Thứ 2 - Chủ Nhật</p>
                            <p className="text-amber-500 font-bold">7:00 - 23:00</p>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
                    <p>&copy; 2024 Coffee Blend. Tất cả quyền được bảo lưu.</p>
                    <p className="text-gray-500 mt-2">Thiết kế bởi Coffee Blend Team</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;