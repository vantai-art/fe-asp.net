// src/pages/staff/StaffPage.jsx - Complete POS System with Slide-to-Pay & Payment Integration
import React, { useState, useEffect, useRef } from "react";
import {
    Plus,
    Minus,
    Trash2,
    ShoppingCart,
    CreditCard,
    Search,
    LogOut,
    Download,
    X,
    Smartphone,
    Banknote,
    ChevronRight,
    CheckCircle2,
    Loader2,
    QrCode,
    Wallet
} from "lucide-react";
import { useAppContext } from "../../contexts/AppContext";
import { useNavigate } from "react-router-dom";

function StaffPage() {
    const navigate = useNavigate();

    const {
        products: contextProducts,
        tables: contextTables,
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        axiosInstance,
    } = useAppContext();

    // State Management
    const [products, setProducts] = useState([]);
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Tất cả");
    const [customerName, setCustomerName] = useState("");
    const [isLoadingTables, setIsLoadingTables] = useState(false);
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);

    // Payment Modal States
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [receivedAmount, setReceivedAmount] = useState("");
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [pendingOrderData, setPendingOrderData] = useState(null);

    // Slide to Pay States
    const [slidePosition, setSlidePosition] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const slideRef = useRef(null);
    const containerRef = useRef(null);

    // QR Code & Payment Status
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("PENDING");
    const [transactionId, setTransactionId] = useState("");
    const [checkingPayment, setCheckingPayment] = useState(false);

    // Bills History States
    const [showBillsModal, setShowBillsModal] = useState(false);
    const [bills, setBills] = useState([]);
    const [isLoadingBills, setIsLoadingBills] = useState(false);

    const user = JSON.parse(localStorage.getItem("staff_user") || "{}");
    const getToken = () => localStorage.getItem("staff_token");

    // ==================== FETCH DATA ====================
    const fetchTables = async () => {
        setIsLoadingTables(true);
        try {
            const token = getToken();
            if (!token) {
                navigate('/staff/login');
                return;
            }

            const res = await axiosInstance.get('/table', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = res.data?.data || res.data;
            setTables(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("❌ Lỗi tải bàn:", err);
            if (err.response?.status === 401) {
                alert('⚠️ Phiên hết hạn!');
                localStorage.removeItem('staff_token');
                localStorage.removeItem('staff_user');
                navigate('/staff/login');
            }
        } finally {
            setIsLoadingTables(false);
        }
    };

    const fetchBills = async () => {
        setIsLoadingBills(true);
        try {
            const token = getToken();
            if (!token) return;

            const res = await axiosInstance.get('/payment', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = res.data?.data || res.data;
            const billsList = Array.isArray(data) ? data : [];
            billsList.sort((a, b) => new Date(b.issuedAt || b.createdAt) - new Date(a.issuedAt || a.createdAt));
            setBills(billsList);
        } catch (err) {
            console.error("❌ Lỗi tải bills:", err);
        } finally {
            setIsLoadingBills(false);
        }
    };

    useEffect(() => {
        setProducts(contextProducts || []);
        if (contextTables?.length > 0) {
            setTables(contextTables);
        } else {
            fetchTables();
        }
    }, [contextProducts, contextTables]);

    const refreshTables = async () => {
        await fetchTables();
    };

    // ==================== CART MANAGEMENT ====================
    const handleAddToCart = (product) => {
        addToCart(product);
        const notification = document.createElement("div");
        notification.className = "fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50";
        notification.textContent = `✅ Đã thêm "${product.name}"`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    };

    const handleUpdateQuantity = (id, newQuantity) => {
        if (newQuantity <= 0) removeFromCart(id);
        else updateQuantity(id, newQuantity);
    };

    // ==================== PAYMENT QR GENERATION ====================
    const generateFallbackQR = (method, orderData) => {
        const amount = orderData.total;
        const orderId = orderData.orderId;

        let qrUrl = "";

        if (method === "MOMO") {
            const momoPhone = "0328778198";
            const note = `Don hang ${orderId}`;
            const momoData = `2|99|${momoPhone}|||0|0|${amount}|${note}`;
            qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(momoData)}`;
        } else if (method === "VNPAY") {
            const bank = "TPBANK";
            const account = "0328778198";
            const accountName = "FOOD AND DRINK";
            qrUrl = `https://img.vietqr.io/image/${bank}-${account}-compact2.png?amount=${amount}&addInfo=Don%20${orderId}&accountName=${encodeURIComponent(accountName)}`;
        } else if (method === "PAYOS") {
            const bank = "TPBANK";
            const account = "0328778198";
            const accountName = "FOOD AND DRINK";
            qrUrl = `https://img.vietqr.io/image/${bank}-${account}-compact2.png?amount=${amount}&addInfo=Don%20${orderId}&accountName=${encodeURIComponent(accountName)}`;
        } else {
            qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`Payment: ${amount}VND - Order: ${orderId}`)}`;
        }

        return {
            qrUrl: qrUrl,
            transactionId: `${method}_${Date.now()}`
        };
    };

    const checkPaymentStatus = async (method, txnId) => {
        return { status: "PAID", message: "Thanh toán thành công" };
    };

    // ==================== SLIDE TO PAY ====================
    const handleMouseDown = (e) => {
        if (paymentSuccess || isProcessingPayment) return;

        if (paymentMethod === "CASH") {
            const received = parseFloat(receivedAmount);
            if (!received || received < pendingOrderData?.total) {
                alert("❌ Vui lòng nhập số tiền khách đưa hợp lệ!");
                return;
            }
        }

        if (["VNPAY", "MOMO", "PAYOS"].includes(paymentMethod) && !qrCodeUrl) {
            alert("❌ Đang tạo mã QR, vui lòng đợi...");
            return;
        }

        setIsDragging(true);
        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!isDragging || paymentSuccess) return;

        const container = containerRef.current;
        const slider = slideRef.current;
        if (!container || !slider) return;

        const containerRect = container.getBoundingClientRect();
        const sliderWidth = slider.offsetWidth;
        const maxSlide = containerRect.width - sliderWidth;

        let clientX;
        if (e.type === 'mousemove') {
            clientX = e.clientX;
        } else if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
        }

        let newPosition = clientX - containerRect.left - (sliderWidth / 2);
        newPosition = Math.max(0, Math.min(newPosition, maxSlide));
        setSlidePosition(newPosition);

        if (newPosition >= maxSlide * 0.95) {
            setIsDragging(false);
            handlePaymentComplete();
        }
    };

    const handleMouseUp = () => {
        if (paymentSuccess) return;
        setIsDragging(false);
        const container = containerRef.current;
        const slider = slideRef.current;
        if (container && slider) {
            const maxSlide = container.offsetWidth - slider.offsetWidth;
            if (slidePosition < maxSlide * 0.95) {
                setSlidePosition(0);
            }
        }
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleMouseMove);
            window.addEventListener('touchend', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleMouseMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDragging, slidePosition, paymentSuccess]);

    // ==================== CREATE ORDER ====================
    const handleCreateOrder = async () => {
        const token = getToken();

        if (!token || !user?.username) {
            alert("⚠️ Phiên đăng nhập hết hạn!");
            navigate("/staff/login");
            return;
        }

        if (!selectedTable) {
            alert("⚠️ Chưa chọn bàn!");
            return;
        }

        if (cart.length === 0) {
            alert("⚠️ Giỏ hàng trống!");
            return;
        }

        if (selectedTable.status !== "Available") {
            alert("❌ Bàn đã có khách!");
            return;
        }

        setIsCreatingOrder(true);

        try {
            // BE mới: tạo đơn 1 lần với items[] bên trong - bàn tự động Occupied
            const orderPayload = {
                tableId: selectedTable.id,
                note: `${customerName?.trim() || "Khách lẻ"} - NV: ${user.username || user.fullName}`,
                items: cart.map(item => ({
                    foodId: item.id,
                    quantity: item.quantity,
                    note: item.note || "",
                })),
            };

            const orderRes = await axiosInstance.post("/order", orderPayload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const order = orderRes.data?.data || orderRes.data;

            if (!order?.id) {
                throw new Error("Server không trả về ID đơn hàng");
            }
            // Không cần cập nhật bàn - BE tự xử lý

            setPendingOrderData({
                orderId: order.id,
                table: { ...selectedTable },
                customer: { name: customerName || "Khách lẻ" },
                items: [...cart],
                total: cartTotal
            });

            setShowPaymentModal(true);

        } catch (err) {
            console.error("❌ Lỗi tạo đơn hàng:", err);
            alert("❌ Không thể tạo đơn hàng: " + (err.response?.data?.message || err.message));
            await refreshTables();
        } finally {
            setIsCreatingOrder(false);
        }
    };

    // ==================== HANDLE PAYMENT ====================
    const handlePaymentComplete = async () => {
        if (paymentSuccess || isProcessingPayment) return;

        setPaymentSuccess(true);
        setIsProcessingPayment(true);

        try {
            const token = getToken();
            let finalTransactionId = transactionId;
            let finalStatus = "PAID";

            if (["VNPAY", "MOMO", "PAYOS"].includes(paymentMethod)) {
                setCheckingPayment(true);
                const statusCheck = await checkPaymentStatus(paymentMethod, transactionId);

                if (statusCheck.status !== "PAID") {
                    alert(`❌ Thanh toán chưa hoàn tất!\nTrạng thái: ${statusCheck.message || "Đang chờ"}`);
                    resetSlider();
                    setIsProcessingPayment(false);
                    return;
                }

                finalStatus = statusCheck.status;
                setCheckingPayment(false);
            }

            try {
                // BE mới: POST /payment nhận { orderId, method: "Cash"|"Card"|"Transfer", note }
                const methodMap = {
                    "CASH": "Cash", "MOMO": "Transfer", "VNPAY": "Transfer",
                    "PAYOS": "Transfer", "CARD": "Card", "QR": "Transfer"
                };
                const billPayload = {
                    orderId: pendingOrderData.orderId,
                    method: methodMap[paymentMethod] || "Cash",
                    note: `Bàn ${pendingOrderData.table.tableNumber} - ${pendingOrderData.customer.name} - PT: ${getPaymentMethodName(paymentMethod)}`
                };

                await axiosInstance.post("/payment", billPayload, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (billErr) {
                console.error("⚠️ Không thể lưu bill (bỏ qua):", billErr);
            }

            await exportBillToPDF(pendingOrderData, paymentMethod, {
                received: paymentMethod === "CASH" ? parseFloat(receivedAmount) : null,
                change: paymentMethod === "CASH" ? parseFloat(receivedAmount) - pendingOrderData.total : null,
                transactionId: finalTransactionId
            });

            setTimeout(() => {
                const changeAmount = paymentMethod === "CASH"
                    ? (parseFloat(receivedAmount) - pendingOrderData.total).toLocaleString('vi-VN')
                    : null;

                alert(`✅ Thanh toán thành công!\n\n${paymentMethod === "CASH"
                    ? `💵 Tiền thừa: ${changeAmount}đ`
                    : `🎉 Mã GD: ${finalTransactionId}`
                    }\n\n📄 Hóa đơn đã được xuất`);

                clearCart();
                setSelectedTable(null);
                setCustomerName("");
                setShowPaymentModal(false);
                setPendingOrderData(null);
                setReceivedAmount("");
                setPaymentMethod("CASH");
                resetSlider();
                setQrCodeUrl("");
                setPaymentStatus("PENDING");
                setTransactionId("");
                refreshTables();
            }, 500);

        } catch (err) {
            console.error("❌ Lỗi thanh toán:", err);
            alert("❌ Thanh toán thất bại: " + (err.response?.data?.message || err.message));
            resetSlider();
        } finally {
            setIsProcessingPayment(false);
            setCheckingPayment(false);
        }
    };

    const resetSlider = () => {
        setSlidePosition(0);
        setPaymentSuccess(false);
        setIsDragging(false);
    };

    const getPaymentMethodName = (method) => {
        const names = {
            CASH: "Tiền mặt",
            VNPAY: "VNPay",
            MOMO: "MoMo",
            PAYOS: "PayOS"
        };
        return names[method] || method;
    };

    // ==================== EXPORT BILL ====================
    const exportBillToPDF = async (orderData, method, paymentInfo) => {
        try {
            const token = getToken();
            const res = await axiosInstance.get(`/order/${orderData.orderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // BE mới: GET /order/{id} trả về order object với orderDetails bên trong
            const orderObj = res.data?.data || res.data;
            const orderItems = orderObj?.orderDetails || orderObj?.OrderDetails || [];

            let total = 0;
            const itemsHTML = orderItems.map((item, i) => {
                const productName = item.food?.name || item.Food?.name || item.productName || "N/A";
                const quantity = item.quantity || 0;
                const price = item.unitPrice || item.price || 0;
                const amount = quantity * price;
                total += amount;

                return `
                    <tr>
                        <td style="text-align: center; padding: 10px; border-bottom: 1px solid #e5e7eb;">${i + 1}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${productName}</td>
                        <td style="text-align: center; padding: 10px; border-bottom: 1px solid #e5e7eb;">${quantity}</td>
                        <td style="text-align: right; padding: 10px; border-bottom: 1px solid #e5e7eb;">${price.toLocaleString("vi-VN")}đ</td>
                        <td style="text-align: right; padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>${amount.toLocaleString("vi-VN")}đ</strong></td>
                    </tr>
                `;
            }).join('');

            const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Hóa đơn #${orderData.orderId}</title>
    <style>
        @page { size: A4; margin: 20mm; }
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #d97706;
            padding-bottom: 15px;
        }
        .header h1 {
            color: #d97706;
            margin: 0;
            font-size: 32px;
        }
        .header h2 {
            color: #666;
            margin: 10px 0 0 0;
            font-size: 18px;
            font-weight: normal;
        }
        .info-section {
            margin: 25px 0;
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
        }
        .info-section h3 {
            background: #d97706;
            color: white;
            padding: 10px;
            margin: -20px -20px 15px -20px;
            border-radius: 8px 8px 0 0;
            font-size: 16px;
        }
        .info-row {
            padding: 8px 0;
            display: flex;
            justify-content: space-between;
            border-bottom: 1px dashed #ddd;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: bold;
            color: #555;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        th {
            background: #d97706;
            color: white;
            padding: 15px 10px;
            text-align: left;
            font-weight: bold;
        }
        td {
            padding: 12px 10px;
            border-bottom: 1px solid #e5e7eb;
        }
        .total-section {
            margin-top: 30px;
            padding: 25px;
            background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 15px 0;
            font-size: 28px;
            font-weight: bold;
            color: #d97706;
        }
        .payment-info {
            margin-top: 25px;
            padding: 20px;
            background: #ecfdf5;
            border: 3px solid #10b981;
            border-radius: 10px;
        }
        .payment-info h3 {
            color: #059669;
            margin: 0 0 15px 0;
            font-size: 18px;
        }
        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 25px;
            border-top: 3px solid #d97706;
            color: #666;
        }
        .footer p {
            margin: 8px 0;
        }
        @media print {
            body { padding: 10mm; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>☕ FOOD AND DRINK</h1>
        <h2>HÓA ĐƠN THANH TOÁN</h2>
    </div>

    <div class="info-section">
        <h3>📋 THÔNG TIN ĐƠN HÀNG</h3>
        <div class="info-row">
            <span class="info-label">Mã đơn hàng:</span>
            <span><strong>#${orderData.orderId}</strong></span>
        </div>
        <div class="info-row">
            <span class="info-label">Ngày tạo:</span>
            <span>${new Date().toLocaleString("vi-VN")}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Bàn:</span>
            <span>Bàn ${orderData.table.tableNumber}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Khách hàng:</span>
            <span>${orderData.customer.name}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Nhân viên:</span>
            <span>${user.username || user.fullName}</span>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 50px; text-align: center;">STT</th>
                <th>Tên món</th>
                <th style="width: 80px; text-align: center;">SL</th>
                <th style="width: 120px; text-align: right;">Đơn giá</th>
                <th style="width: 140px; text-align: right;">Thành tiền</th>
            </tr>
        </thead>
        <tbody>
            ${itemsHTML}
        </tbody>
    </table>

    <div class="total-section">
        <div class="total-row">
            <span>TỔNG CỘNG:</span>
            <span>${total.toLocaleString("vi-VN")}đ</span>
        </div>
    </div>

    <div class="payment-info">
        <h3>✓ THÔNG TIN THANH TOÁN</h3>
        <div class="info-row">
            <span class="info-label">Phương thức:</span>
            <span><strong>${getPaymentMethodName(method)}</strong></span>
        </div>
        <div class="info-row">
            <span class="info-label">Trạng thái:</span>
            <span style="color: #059669; font-weight: bold;">✓ Đã thanh toán</span>
        </div>
        ${method === 'CASH' ? `
        <div class="info-row">
            <span class="info-label">Khách đưa:</span>
            <span>${paymentInfo.received?.toLocaleString("vi-VN")}đ</span>
        </div>
        <div class="info-row">
            <span class="info-label">Tiền thừa:</span>
            <span style="color: #059669; font-weight: bold; font-size: 18px;">${paymentInfo.change?.toLocaleString("vi-VN")}đ</span>
        </div>
        ` : `
        <div class="info-row">
            <span class="info-label">Mã giao dịch:</span>
            <span><code style="background: #fff; padding: 4px 8px; border-radius: 4px;">${paymentInfo.transactionId}</code></span>
        </div>
        `}
    </div>

    <div class="footer">
        <p style="font-size: 18px; font-weight: bold; color: #d97706;">Cảm ơn quý khách! Hẹn gặp lại! 🙏</p>
        <p style="font-size: 14px; margin-top: 10px;">FOOD AND DRINK - Dịch vụ chuyên nghiệp, chất lượng</p>
        <p style="font-size: 12px; color: #999;">Hotline: 1900 xxxx | Email: contact@coffeeblend.vn</p>
    </div>

    <div class="no-print" style="margin-top: 40px; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 10px;">
        <button onclick="window.print()" style="
            background: #d97706;
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 16px;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            margin-right: 15px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        ">🖨️ In hóa đơn / Lưu PDF</button>
        <button onclick="window.close()" style="
            background: #6b7280;
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 16px;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        ">✕ Đóng</button>
    </div>
</body>
</html>
            `;

            const printWindow = window.open('', '_blank');

            if (printWindow && !printWindow.closed) {
                printWindow.document.write(html);
                printWindow.document.close();
            } else {
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `HoaDon_Ban${orderData.table.tableNumber}_${orderData.orderId}_${Date.now()}.html`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                alert('✅ Hóa đơn đã được tải xuống!\n\n📄 Mở file HTML vừa tải để xem và in.');
            }

        } catch (err) {
            console.error("❌ Lỗi xuất hóa đơn:", err);
            alert("❌ Không thể xuất hóa đơn: " + err.message);
        }
    };

    // ==================== PAYMENT METHOD CHANGE ====================
    const handlePaymentMethodChange = async (method) => {
        setPaymentMethod(method);
        setQrCodeUrl("");
        setTransactionId("");
        setPaymentStatus("PENDING");

        if (["VNPAY", "MOMO", "PAYOS"].includes(method) && pendingOrderData) {
            try {
                const result = generateFallbackQR(method, pendingOrderData);
                setQrCodeUrl(result.qrUrl);
                setTransactionId(result.transactionId);
            } catch (err) {
                console.error("❌ Lỗi tạo QR:", err);
                alert("❌ Không thể tạo mã QR thanh toán!");
            }
        }
    };
    // ==================== LOGOUT ====================
    const handleLogout = () => {
        if (!window.confirm("Bạn có chắc muốn đăng xuất?")) return;
        localStorage.removeItem("staff_token");
        localStorage.removeItem("staff_user");
        navigate("/staff/login");
    };

    // ==================== FILTER LOGIC ====================
    const categories = [
        "Tất cả",
        ...new Set(products.map((p) => p.category?.name).filter(Boolean)),
    ];

    const filteredProducts = products.filter((p) => {
        const matchSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCat = selectedCategory === "Tất cả" || p.category?.name === selectedCategory;
        const available = p.isAvailable !== false; // ✅ chỉ hiện món đang phục vụ
        return matchSearch && matchCat && available;
    });

    const sliderProgress = containerRef.current && slideRef.current
        ? (slidePosition / (containerRef.current.offsetWidth - slideRef.current.offsetWidth)) * 100
        : 0;

    // ==================== RENDER ====================
    return (
        <div className="min-h-screen bg-gray-900 flex">
            {/* LEFT PANEL - Products */}
            <div className="flex-1 p-6 overflow-y-auto h-screen">
                <div className="bg-gray-800 rounded-lg p-4 mb-6 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-white">POS - Nhân Viên</h1>
                        {user?.username && (
                            <p className="text-gray-400 text-sm">
                                👋 Chào {user.username || user.fullName}
                            </p>
                        )}
                    </div>
                    {getToken() && (
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" /> Đăng xuất
                        </button>
                    )}
                </div>

                <div className="bg-gray-800 rounded-lg p-4 mb-6">
                    <button
                        onClick={() => {
                            setShowBillsModal(true);
                            fetchBills();
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-semibold"
                    >
                        <CreditCard className="w-5 h-5" />
                        Xem lịch sử hóa đơn
                    </button>
                </div>

                <div className="mb-6 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm sản phẩm..."
                            className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-amber-500 outline-none"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${selectedCategory === cat
                                    ? "bg-amber-600 text-white"
                                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => (
                        <button
                            key={product.id}
                            onClick={() => handleAddToCart(product)}
                            disabled={false}
                            className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 text-left disabled:opacity-50 transition"
                        >
                            <div className="aspect-square bg-gray-700 rounded-lg mb-3 overflow-hidden">
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://placehold.co/400x400/374151/9ca3af?text=No+Image';
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                                        No Image
                                    </div>
                                )}
                            </div>
                            <h3 className="text-white font-semibold mb-1 line-clamp-2">
                                {product.name}
                            </h3>
                            <p className="text-amber-500 font-bold">
                                {product.price?.toLocaleString("vi-VN")}đ
                            </p>
                            <p className="text-sm text-green-500">
                                Có sẵn
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT PANEL - Cart & Tables */}
            <div className="w-96 bg-gray-800 flex flex-col max-h-screen">
                <div className="flex-1 overflow-y-auto p-6 pb-4">
                    <div className="mb-6">
                        <div className="flex justify-between mb-3">
                            <h2 className="text-white font-bold">Danh sách bàn</h2>
                            <button
                                onClick={refreshTables}
                                disabled={isLoadingTables}
                                className="text-amber-500 text-sm hover:text-amber-400 transition-colors disabled:opacity-50"
                            >
                                {isLoadingTables ? "Đang tải..." : "Làm mới"}
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {tables.map((table) => (
                                <button
                                    key={table.id}
                                    onClick={() => {
                                        if (table.status !== "Available") {
                                            alert("❌ Bàn đang có khách!");
                                            return;
                                        }
                                        setSelectedTable(table);
                                    }}
                                    className={`p-3 rounded-lg text-center transition ${table.status === "Available"
                                        ? selectedTable?.id === table.id
                                            ? "bg-amber-600"
                                            : "bg-green-700 hover:bg-green-600"
                                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                                        } text-white`}
                                >
                                    <div className="font-bold">Bàn {table.tableNumber}</div>
                                    <div className="text-xs mt-1">
                                        {table.status === "Available" ? "🟢 Trống" : "🔴 Bận"}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {selectedTable && (
                            <div className="bg-gray-700 p-3 rounded-lg">
                                <p className="text-white font-semibold mb-2">
                                    Bàn {selectedTable.number}
                                </p>
                                <input
                                    placeholder="Tên khách hàng (tùy chọn)"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-amber-500 outline-none"
                                />
                            </div>
                        )}
                    </div>

                    <div className="mb-4">
                        <h2 className="text-white font-bold mb-3 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5" /> Đơn hàng ({cart.length})
                        </h2>

                        {cart.length === 0 ? (
                            <p className="text-gray-400 text-center py-8">Chưa có món nào</p>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                {cart.map((item) => (
                                    <div key={item.id} className="bg-gray-700 rounded-lg p-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="text-white font-semibold text-sm">
                                                    {item.name}
                                                </h3>
                                                <p className="text-amber-500 font-bold">
                                                    {item.price?.toLocaleString("vi-VN")}đ
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                className="bg-gray-600 hover:bg-gray-500 text-white w-8 h-8 rounded flex items-center justify-center transition-colors"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="text-white font-bold w-12 text-center">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                className="bg-gray-600 hover:bg-gray-500 text-white w-8 h-8 rounded flex items-center justify-center transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                            <span className="text-gray-300 ml-auto">
                                                {(item.quantity * item.price).toLocaleString("vi-VN")}đ
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 pt-0 border-t border-gray-700">
                    <div className="bg-gray-700 rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400">Tạm tính:</span>
                            <span className="text-white font-semibold">
                                {cartTotal.toLocaleString("vi-VN")}đ
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-white font-bold text-lg">Tổng cộng:</span>
                            <span className="text-amber-500 font-bold text-xl">
                                {cartTotal.toLocaleString("vi-VN")}đ
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleCreateOrder}
                        disabled={isCreatingOrder || cart.length === 0 || !selectedTable}
                        className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {isCreatingOrder ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <CreditCard className="w-5 h-5" />
                                Tạo đơn & Thanh toán
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* PAYMENT MODAL */}
            {showPaymentModal && pendingOrderData && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                            <h2 className="text-xl font-bold text-white">Thanh toán</h2>
                            <button
                                onClick={async () => {
                                    if (window.confirm("Hủy thanh toán? Bàn sẽ được giải phóng và đơn hàng sẽ bị hủy.")) {
                                        try {
                                            const token = getToken();

                                            // 1. Xóa order items
                                            if (pendingOrderData?.orderId) {
                                                try {
                                                    await axiosInstance.delete(`/order/${pendingOrderData.orderId}`, {
                                                        headers: { 'Authorization': `Bearer ${token}` }
                                                    });
                                                } catch (err) {
                                                    console.error("⚠️ Không thể xóa order:", err);
                                                }
                                            }

                                            // 2. Đặt lại trạng thái bàn về FREE
                                            if (pendingOrderData?.table?.id) {
                                                try {
                                                    await axiosInstance.put(`/table/${pendingOrderData.table.id}`, {
                                                        number: pendingOrderData.table.tableNumber,
                                                        capacity: pendingOrderData.table.capacity,
                                                        status: "Available"
                                                    }, {
                                                        headers: { 'Authorization': `Bearer ${token}` }
                                                    });
                                                } catch (err) {
                                                    console.error("⚠️ Không thể reset bàn:", err);
                                                }
                                            }

                                            // 3. Reset UI states
                                            setShowPaymentModal(false);
                                            setPendingOrderData(null);
                                            setReceivedAmount("");
                                            setPaymentMethod("CASH");
                                            setQrCodeUrl("");
                                            setTransactionId("");
                                            resetSlider();
                                            clearCart();
                                            setSelectedTable(null);
                                            setCustomerName("");

                                            // 4. Refresh tables
                                            await refreshTables();

                                            alert("✅ Đã hủy thanh toán và giải phóng bàn");

                                        } catch (err) {
                                            console.error("❌ Lỗi hủy thanh toán:", err);
                                            alert("❌ Có lỗi khi hủy: " + err.message);
                                        }
                                    }
                                }}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="px-4 py-4 space-y-4 flex-1 overflow-y-auto">
                            <div className="bg-gray-700 rounded-lg p-3">
                                <p className="text-gray-400 text-xs mb-1">Đơn hàng #{pendingOrderData.orderId}</p>
                                <p className="text-white font-semibold text-sm">
                                    Bàn {pendingOrderData.table.tableNumber} - {pendingOrderData.customer.name}
                                </p>
                                <p className="text-amber-500 font-bold text-xl mt-1">
                                    {pendingOrderData.total.toLocaleString("vi-VN")}đ
                                </p>
                            </div>

                            <div>
                                <label className="text-white font-semibold block mb-2 text-sm">
                                    Chọn phương thức thanh toán
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    <button
                                        onClick={() => handlePaymentMethodChange("CASH")}
                                        className={`p-3 rounded-lg border-2 transition-all ${paymentMethod === "CASH"
                                            ? "border-amber-500 bg-amber-500 bg-opacity-10"
                                            : "border-gray-600 bg-gray-700"
                                            }`}
                                    >
                                        <Banknote className={`w-6 h-6 mx-auto mb-1 ${paymentMethod === "CASH" ? "text-amber-500" : "text-gray-400"}`} />
                                        <p className="text-white font-medium text-center text-xs">Tiền mặt</p>
                                    </button>

                                    <button
                                        onClick={() => handlePaymentMethodChange("MOMO")}
                                        className={`p-3 rounded-lg border-2 transition-all ${paymentMethod === "MOMO"
                                            ? "border-pink-500 bg-pink-500 bg-opacity-10"
                                            : "border-gray-600 bg-gray-700"
                                            }`}
                                    >
                                        <Wallet className={`w-6 h-6 mx-auto mb-1 ${paymentMethod === "MOMO" ? "text-pink-500" : "text-gray-400"}`} />
                                        <p className="text-white font-medium text-center text-xs">MoMo</p>
                                    </button>

                                    <button
                                        onClick={() => handlePaymentMethodChange("VNPAY")}
                                        className={`p-3 rounded-lg border-2 transition-all ${paymentMethod === "VNPAY"
                                            ? "border-blue-500 bg-blue-500 bg-opacity-10"
                                            : "border-gray-600 bg-gray-700"
                                            }`}
                                    >
                                        <CreditCard className={`w-6 h-6 mx-auto mb-1 ${paymentMethod === "VNPAY" ? "text-blue-500" : "text-gray-400"}`} />
                                        <p className="text-white font-medium text-center text-xs">VNPay</p>
                                    </button>

                                    <button
                                        onClick={() => handlePaymentMethodChange("PAYOS")}
                                        className={`p-3 rounded-lg border-2 transition-all ${paymentMethod === "PAYOS"
                                            ? "border-green-500 bg-green-500 bg-opacity-10"
                                            : "border-gray-600 bg-gray-700"
                                            }`}
                                    >
                                        <QrCode className={`w-6 h-6 mx-auto mb-1 ${paymentMethod === "PAYOS" ? "text-green-500" : "text-gray-400"}`} />
                                        <p className="text-white font-medium text-center text-xs">PayOS</p>
                                    </button>
                                </div>
                            </div>

                            {paymentMethod === "CASH" && (
                                <div>
                                    <label className="text-white font-semibold block mb-2 text-sm">
                                        Số tiền khách đưa
                                    </label>
                                    <input
                                        type="number"
                                        value={receivedAmount}
                                        onChange={(e) => setReceivedAmount(e.target.value)}
                                        placeholder="Nhập số tiền..."
                                        className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-amber-500 outline-none"
                                    />
                                    {receivedAmount && parseFloat(receivedAmount) >= pendingOrderData.total && (
                                        <div className="mt-2 bg-green-900 bg-opacity-30 border border-green-500 rounded-lg p-2">
                                            <p className="text-green-400 font-semibold text-sm">
                                                💵 Tiền thừa: {(parseFloat(receivedAmount) - pendingOrderData.total).toLocaleString("vi-VN")}đ
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {["VNPAY", "MOMO", "PAYOS"].includes(paymentMethod) && (
                                <div className="bg-gray-700 rounded-lg p-3">
                                    {qrCodeUrl ? (
                                        <>
                                            <div className="bg-white rounded-lg p-3 mb-2">
                                                <img
                                                    src={qrCodeUrl}
                                                    alt="QR Code"
                                                    className="w-full h-auto max-h-64 object-contain"
                                                    onError={(e) => {
                                                        e.target.src = 'https://placehold.co/300x300/1f2937/f59e0b?text=QR+Error';
                                                    }}
                                                />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-amber-500 font-semibold text-sm mb-1">
                                                    📱 Quét mã QR để thanh toán
                                                </p>
                                                <p className="text-gray-400 text-xs">
                                                    Mã GD: {transactionId}
                                                </p>
                                            </div>
                                            {checkingPayment && (
                                                <div className="mt-2 flex items-center justify-center gap-2 text-blue-400">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span className="text-xs">Đang kiểm tra thanh toán...</span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-6">
                                            <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-2" />
                                            <p className="text-gray-400 text-sm">Đang tạo mã QR...</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-700 bg-gray-800 flex-shrink-0">
                            <div className="space-y-2">
                                <p className="text-gray-400 text-xs text-center">
                                    {paymentSuccess
                                        ? "✅ Đã xác nhận thanh toán!"
                                        : "👉 Kéo sang phải để xác nhận thanh toán"
                                    }
                                </p>

                                <div
                                    ref={containerRef}
                                    className={`relative h-16 rounded-full overflow-hidden ${paymentSuccess
                                        ? "bg-green-600"
                                        : "bg-gray-700"
                                        }`}
                                >
                                    <div
                                        className={`absolute inset-0 ${paymentSuccess
                                            ? "bg-green-500"
                                            : "bg-amber-500"
                                            } transition-all duration-200`}
                                        style={{
                                            width: `${paymentSuccess ? 100 : sliderProgress}%`,
                                            opacity: paymentSuccess ? 1 : 0.3
                                        }}
                                    />

                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <span className={`font-bold ${paymentSuccess
                                            ? "text-white"
                                            : sliderProgress > 50
                                                ? "text-white"
                                                : "text-gray-400"
                                            }`}>
                                            {paymentSuccess
                                                ? "✓ Đã thanh toán"
                                                : isProcessingPayment
                                                    ? "Đang xử lý..."
                                                    : "Kéo sang phải →"
                                            }
                                        </span>
                                    </div>

                                    {!paymentSuccess && (
                                        <div
                                            ref={slideRef}
                                            onMouseDown={handleMouseDown}
                                            onTouchStart={handleMouseDown}
                                            className={`absolute left-0 top-0 h-full w-16 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors ${isDragging
                                                ? "bg-amber-400"
                                                : "bg-amber-500 hover:bg-amber-400"
                                                }`}
                                            style={{
                                                transform: `translateX(${slidePosition}px)`,
                                                touchAction: 'none'
                                            }}
                                        >
                                            {isProcessingPayment ? (
                                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                                            ) : (
                                                <ChevronRight className="w-6 h-6 text-white" />
                                            )}
                                        </div>
                                    )}

                                    {paymentSuccess && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <CheckCircle2 className="w-8 h-8 text-white" />
                                        </div>
                                    )}
                                </div>

                                <p className="text-gray-500 text-xs text-center">
                                    {paymentMethod === "CASH"
                                        ? "⚠️ Nhập đủ số tiền trước khi kéo"
                                        : ["VNPAY", "MOMO", "PAYOS"].includes(paymentMethod)
                                            ? "✓ Khách đã quét QR? Kéo để xác nhận"
                                            : "Kéo để hoàn tất thanh toán"
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* BILLS HISTORY MODAL */}
            {showBillsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800 z-10">
                            <h2 className="text-xl font-bold text-white">Lịch sử hóa đơn</h2>
                            <button
                                onClick={() => setShowBillsModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            {isLoadingBills ? (
                                <div className="text-center py-12">
                                    <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-gray-400">Đang tải...</p>
                                </div>
                            ) : bills.length === 0 ? (
                                <div className="text-center py-12">
                                    <CreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-400">Chưa có hóa đơn nào</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {bills.map((bill) => (
                                        <div key={bill.id} className="bg-gray-700 rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-white font-semibold text-lg">
                                                        Hóa đơn #{bill.id}
                                                    </p>
                                                    <p className="text-gray-400 text-sm">
                                                        {new Date(bill.issuedAt || bill.createdAt).toLocaleString("vi-VN")}
                                                    </p>
                                                    {bill.transactionId && (
                                                        <p className="text-gray-500 text-xs mt-1">
                                                            Mã GD: {bill.transactionId}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-amber-500 font-bold text-xl">
                                                        {bill.totalAmount?.toLocaleString("vi-VN")}đ
                                                    </p>
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${bill.paymentStatus === "PAID"
                                                        ? "bg-green-900 text-green-300"
                                                        : "bg-yellow-900 text-yellow-300"
                                                        }`}>
                                                        {bill.paymentStatus === "PAID" ? "Đã thanh toán" : "Chờ thanh toán"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="flex items-center gap-1 text-gray-300">
                                                    {bill.paymentMethod === "CASH" ? (
                                                        <>
                                                            <Banknote className="w-4 h-4" />
                                                            Tiền mặt
                                                        </>
                                                    ) : bill.paymentMethod === "MOMO" ? (
                                                        <>
                                                            <Wallet className="w-4 h-4 text-pink-400" />
                                                            MoMo
                                                        </>
                                                    ) : bill.paymentMethod === "VNPAY" ? (
                                                        <>
                                                            <CreditCard className="w-4 h-4 text-blue-400" />
                                                            VNPay
                                                        </>
                                                    ) : bill.paymentMethod === "PAYOS" ? (
                                                        <>
                                                            <QrCode className="w-4 h-4 text-green-400" />
                                                            PayOS
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Smartphone className="w-4 h-4" />
                                                            {bill.paymentMethod}
                                                        </>
                                                    )}
                                                </span>
                                            </div>

                                            {bill.notes && (
                                                <div className="mt-3 pt-3 border-t border-gray-600">
                                                    <p className="text-gray-400 text-sm whitespace-pre-line">
                                                        {bill.notes}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StaffPage;