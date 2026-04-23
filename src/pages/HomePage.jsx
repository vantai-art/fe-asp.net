import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Award, Truck } from 'lucide-react';
import Footer from '../components/Footer';

function HomePage() {
    const navigate = useNavigate();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Danh sách ảnh cho slideshow
    const heroImages = [
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1920&h=1080&fit=crop',
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1920&h=1080&fit=crop'
    ];

    // Auto slideshow - chuyển ảnh mỗi 3.5 giây
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
        }, 3500);
        return () => clearInterval(interval);
    }, [heroImages.length]);

    return (
        <div className="min-h-screen bg-black">
            {/* Hero Section with Slideshow */}
            <div className="relative h-screen flex items-center justify-center text-white overflow-hidden">
                {/* Slideshow Images */}
                {heroImages.map((image, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                            }`}
                        style={{
                            backgroundImage: `url(${image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    />
                ))}

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/60 z-[1]"></div>

                {/* Content */}
                <div className="relative text-center z-10 px-4">
                    <h1 className="text-6xl md:text-7xl font-bold mb-4">COFFEE BLEND</h1>
                    <p className="text-xl md:text-2xl mb-8">Nơi Hương Vị Cà Phê Hoà Quyện</p>
                    <button
                        onClick={() => navigate('/shop')}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 text-lg font-semibold rounded transition-colors"
                    >
                        Đặt Hàng Ngay
                    </button>
                </div>

                {/* Slideshow Indicators */}
                <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-10">
                    {heroImages.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`h-2 rounded-full transition-all ${currentImageIndex === index
                                    ? 'bg-amber-500 w-8'
                                    : 'bg-white/50 hover:bg-white/80 w-2'
                                }`}
                            aria-label={`Slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* Features */}
            <div className="container mx-auto px-4 py-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center text-white">
                        <Coffee className="w-16 h-16 mx-auto mb-4 text-amber-500" />
                        <h3 className="text-xl font-bold mb-2">Cà Phê Nguyên Chất</h3>
                        <p className="text-gray-400">100% hạt cà phê tuyển chọn</p>
                    </div>
                    <div className="text-center text-white">
                        <Award className="w-16 h-16 mx-auto mb-4 text-amber-500" />
                        <h3 className="text-xl font-bold mb-2">Chất Lượng Đảm Bảo</h3>
                        <p className="text-gray-400">Được chứng nhận bởi chuyên gia</p>
                    </div>
                    <div className="text-center text-white">
                        <Truck className="w-16 h-16 mx-auto mb-4 text-amber-500" />
                        <h3 className="text-xl font-bold mb-2">Giao Hàng Nhanh</h3>
                        <p className="text-gray-400">Miễn phí ship nội thành</p>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default HomePage;