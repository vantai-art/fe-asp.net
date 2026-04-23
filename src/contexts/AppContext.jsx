// ==============================
// ✅ src/contexts/AppContext.jsx
// ==============================
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
    useCallback,
} from "react";
import axios from "axios";

// ------------------------------
// 🔧 TẠO CONTEXT
// ------------------------------
const AppContext = createContext();

export function AppProvider({ children }) {
    // ====== STATE ======
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tables, setTables] = useState([]);
    const [orders, setOrders] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
        localStorage.getItem("isAdminAuth") === "true"
    );

    const API_BASE = "https://chuyen-de-asp.onrender.com/api";
    const cartCacheRef = useRef(null);

    // ------------------------------
    // ⚙️ CẤU HÌNH AXIOS TOÀN CỤC
    // ------------------------------
    const axiosInstance = axios.create({
        baseURL: API_BASE,
        headers: { "Content-Type": "application/json" },
    });

    useEffect(() => {
        const requestInterceptor = axiosInstance.interceptors.request.use(
            (config) => {
                const adminToken = localStorage.getItem("admin_token");
                const staffToken = localStorage.getItem("staff_token");
                const userToken = localStorage.getItem("user_token");
                const legacyToken = localStorage.getItem("jwt_token");
                const token = adminToken || staffToken || userToken || legacyToken;

                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                    console.log(
                        "🔑 Token from:",
                        adminToken
                            ? "admin"
                            : staffToken
                                ? "staff"
                                : userToken
                                    ? "user"
                                    : "legacy"
                    );
                } else {
                    console.warn("⚠️ No token for:", config.url);
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        const responseInterceptor = axiosInstance.interceptors.response.use(
            (res) => res,
            (err) => {
                const status = err.response?.status;
                if (status === 401 || status === 403) {
                    const path = window.location.pathname;
                    console.error("🚫 Auth error at:", path, status);

                    if (path.startsWith("/admin")) {
                        localStorage.removeItem("admin_token");
                        localStorage.removeItem("admin_user");
                        localStorage.removeItem("isAdminAuth");
                        window.location.href = "/admin/login";
                    } else if (path.startsWith("/staff")) {
                        localStorage.removeItem("staff_token");
                        localStorage.removeItem("staff_user");
                        window.location.href = "/staff/login";
                    } else {
                        localStorage.removeItem("user_token");
                        localStorage.removeItem("user_user");
                        window.location.href = "/auth";
                    }
                }
                return Promise.reject(err);
            }
        );

        return () => {
            axiosInstance.interceptors.request.eject(requestInterceptor);
            axiosInstance.interceptors.response.eject(responseInterceptor);
        };
    }, []);

    // ------------------------------
    // 📡 FETCH DATA BAN ĐẦU
    // ------------------------------
    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            setError(null);
            try {
                console.log("📡 Fetching data...");

                const adminToken = localStorage.getItem("admin_token");
                const staffToken = localStorage.getItem("staff_token");
                const isPrivileged = !!(adminToken || staffToken);

                const [prodRes, catRes, tblRes] = await Promise.allSettled([
                    axiosInstance.get("/food"),
                    axiosInstance.get("/category"),
                    axiosInstance.get("/table"),
                ]);

                // 🗂 Categories
                let categoriesData = [];
                if (catRes.status === "fulfilled") {
                    categoriesData = Array.isArray(catRes.value.data)
                        ? catRes.value.data
                        : [];
                    setCategories(categoriesData);
                    console.log("📁 Categories:", categoriesData.length);
                }

                // 💊 Products
                if (prodRes.status === "fulfilled") {
                    let productsData = Array.isArray(prodRes.value.data)
                        ? prodRes.value.data
                        : [];

                    productsData = productsData.map((p) => ({
                        ...p,
                        category:
                            categoriesData.find((c) => c.id === p.categoryId) || {
                                id: p.categoryId,
                                name: "Khác",
                            },
                    }));

                    setProducts(productsData);
                    console.log("✅ Products:", productsData.length);
                }

                // 🪑 Tables
                if (tblRes.status === "fulfilled") {
                    const tablesData = Array.isArray(tblRes.value.data)
                        ? tblRes.value.data
                        : [];
                    setTables(tablesData);
                    console.log("🪑 Tables:", tablesData.length);
                }

                // 🧾 Orders (admin/staff only)
                if (isPrivileged) {
                    try {
                        const ordRes = await axiosInstance.get("/order");
                        const ordersData = Array.isArray(ordRes.data)
                            ? ordRes.data
                            : ordRes.data?.data || [];
                        setOrders(ordersData);
                        console.log("📋 Orders:", ordersData.length);
                    } catch (ordErr) {
                        console.log("ℹ️ No permission for all orders");
                        setOrders([]);
                    }
                }

                console.log("✅ Initial data loaded!");
            } catch (err) {
                console.error("❌ Load error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, []);

    // ------------------------------
    // 🛒 GIỎ HÀNG (LOAD + SYNC)
    // ------------------------------
    useEffect(() => {
        try {
            const saved = localStorage.getItem("cart_data");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setCart(parsed);
                    cartCacheRef.current = parsed;
                    console.log("📦 Cart loaded:", parsed.length);
                }
            }
        } catch (e) {
            console.error("❌ Cart load error:", e);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem("cart_data", JSON.stringify(cart));
            cartCacheRef.current = cart;
        } catch (e) {
            console.error("❌ Cart save error:", e);
        }
    }, [cart]);

    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === "cart_data" && e.newValue) {
                const newCart = JSON.parse(e.newValue);
                if (Array.isArray(newCart)) {
                    setCart(newCart);
                    cartCacheRef.current = newCart;
                    console.log("🔄 Cart synced");
                }
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    // ------------------------------
    // 🛠 CART FUNCTIONS
    // ------------------------------
    const addToCart = useCallback((product) => {
        setCart((prev) => {
            const exist = prev.find((i) => i.id === product.id);
            return exist
                ? prev.map((i) =>
                    i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
                )
                : [...prev, { ...product, quantity: 1 }];
        });
    }, []);

    const updateQuantity = useCallback((id, qty) => {
        setCart((prev) =>
            qty <= 0
                ? prev.filter((i) => i.id !== id)
                : prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
        );
    }, []);

    const removeFromCart = useCallback(
        (id) => setCart((prev) => prev.filter((i) => i.id !== id)),
        []
    );

    const clearCart = useCallback(() => setCart([]), []);

    const cartTotal = cart.reduce(
        (sum, i) => sum + (i.price || 0) * (i.quantity || 0),
        0
    );

    // ------------------------------
    // 🧾 TẠO ORDER (CHO ADMIN / STAFF)
    // ------------------------------
    const createOrder = async (tableId) => {
        const adminToken = localStorage.getItem("admin_token");
        const staffToken = localStorage.getItem("staff_token");

        if (!adminToken && !staffToken) {
            alert("❌ Không có quyền tạo đơn!");
            return null;
        }
        if (cart.length === 0) {
            alert("🛒 Giỏ hàng trống!");
            return null;
        }

        try {
            console.log("📝 Creating order...");
            // BE mới: tạo đơn 1 lần duy nhất với items[] bên trong
            const orderRes = await axiosInstance.post("/order", {
                tableId,
                note: "",
                items: cart.map(item => ({
                    foodId: item.id,
                    quantity: item.quantity,
                    note: item.note || "",
                })),
            });

            const order = orderRes.data;
            console.log("✅ Order created:", order.id);
            // Bàn tự động đổi Occupied do BE xử lý khi tạo đơn
            clearCart();

            console.log("✅ Order completed!");

            if (adminToken) window.location.href = "/admin/orders";
            if (staffToken) window.location.href = "/staff/orders";

            return order;
        } catch (err) {
            console.error("❌ Order error:", err);
            throw err;
        }
    };

    // ------------------------------
    // 📜 LẤY ĐƠN CỦA USER
    // ------------------------------
    const fetchMyOrders = useCallback(async () => {
        const userToken = localStorage.getItem("user_token");
        if (!userToken) return [];

        try {
            const res = await axiosInstance.get("/order"); // BE mới: lấy tất cả orders của user đang đăng nhập
            return Array.isArray(res.data) ? res.data : [];
        } catch (err) {
            console.error("❌ My orders error:", err);
            return [];
        }
    }, []);

    // ------------------------------
    // 🪑 LẤY DANH SÁCH BÀN
    // ------------------------------
    const fetchTables = useCallback(async () => {
        try {
            const res = await axiosInstance.get("/table");
            const data = res.data?.data || res.data;
            const tablesData = Array.isArray(data) ? data : [];
            setTables(tablesData);
            return tablesData;
        } catch (err) {
            console.error("❌ Tables error:", err);
            return [];
        }
    }, []);

    // ------------------------------
    // ✅ EXPORT VALUE
    // ------------------------------
    const value = {
        products,
        categories,
        tables,
        orders,
        cart,
        cartTotal,
        loading,
        error,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        createOrder,
        fetchMyOrders,
        fetchTables,
        isAdminAuthenticated,
        setIsAdminAuthenticated,
        axiosInstance,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ------------------------------
// ⚡ HOOK SỬ DỤNG
// ------------------------------
export const useAppContext = () => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useAppContext must be used within AppProvider");
    return ctx;
};
