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
        withCredentials: true, // ✅ Quan trọng cho CORS
    });

    // ✅ FIXED: Không tự động thêm token cho public endpoints
    useEffect(() => {
        // Public endpoints không cần token
        const publicEndpoints = [
            '/auth/login',
            '/auth/register',
            '/food',
            '/category',
            '/table'
        ];

        const isPublicEndpoint = (url) => {
            if (!url) return false;
            return publicEndpoints.some(endpoint => url.includes(endpoint));
        };

        const requestInterceptor = axiosInstance.interceptors.request.use(
            (config) => {
                // Bỏ qua thêm token cho public endpoints
                if (isPublicEndpoint(config.url)) {
                    console.log("📢 Public endpoint - no token needed:", config.url);
                    return config;
                }

                // Chỉ thêm token cho endpoints cần auth
                const adminToken = localStorage.getItem("admin_token");
                const staffToken = localStorage.getItem("staff_token");
                const userToken = localStorage.getItem("user_token");
                const legacyToken = localStorage.getItem("jwt_token");
                const token = adminToken || staffToken || userToken || legacyToken;

                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                    console.log(
                        "🔑 Token added for:",
                        config.url,
                        "Role:",
                        adminToken ? "admin" : staffToken ? "staff" : "user"
                    );
                } else {
                    console.log("ℹ️ No token available for:", config.url);
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        const responseInterceptor = axiosInstance.interceptors.response.use(
            (res) => res,
            (err) => {
                const status = err.response?.status;
                const url = err.config?.url;

                // Bỏ qua lỗi auth cho public endpoints
                if (url && publicEndpoints.some(endpoint => url.includes(endpoint))) {
                    console.log("ℹ️ Public endpoint error (ignored):", url, status);
                    return Promise.reject(err);
                }

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
    }, [axiosInstance]);

    // ------------------------------
    // 📡 FETCH DATA BAN ĐẦU (FIXED)
    // ------------------------------
    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            setError(null);
            try {
                console.log("📡 Fetching initial data...");

                // Fetch public data - KHÔNG cần token
                const [prodRes, catRes, tblRes] = await Promise.allSettled([
                    axiosInstance.get("/food"),
                    axiosInstance.get("/category"),
                    axiosInstance.get("/table"),
                ]);

                // 🗂 Categories
                let categoriesData = [];
                if (catRes.status === "fulfilled" && catRes.value.data) {
                    categoriesData = Array.isArray(catRes.value.data)
                        ? catRes.value.data
                        : catRes.value.data.data || [];
                    setCategories(categoriesData);
                    console.log("📁 Categories loaded:", categoriesData.length);
                } else if (catRes.status === "rejected") {
                    console.warn("⚠️ Failed to load categories:", catRes.reason?.message);
                }

                // 💊 Products
                if (prodRes.status === "fulfilled" && prodRes.value.data) {
                    let productsData = Array.isArray(prodRes.value.data)
                        ? prodRes.value.data
                        : prodRes.value.data.data || [];

                    // Map category to product
                    productsData = productsData.map((p) => ({
                        ...p,
                        category: categoriesData.find((c) => c.id === p.categoryId) || {
                            id: p.categoryId,
                            name: "Khác",
                        },
                    }));

                    setProducts(productsData);
                    console.log("✅ Products loaded:", productsData.length);
                } else if (prodRes.status === "rejected") {
                    console.warn("⚠️ Failed to load products:", prodRes.reason?.message);
                }

                // 🪑 Tables
                if (tblRes.status === "fulfilled" && tblRes.value.data) {
                    const tablesData = Array.isArray(tblRes.value.data)
                        ? tblRes.value.data
                        : tblRes.value.data.data || [];
                    setTables(tablesData);
                    console.log("🪑 Tables loaded:", tablesData.length);
                } else if (tblRes.status === "rejected") {
                    console.warn("⚠️ Failed to load tables:", tblRes.reason?.message);
                }

                // 🧾 Orders - chỉ khi có token admin/staff
                const adminToken = localStorage.getItem("admin_token");
                const staffToken = localStorage.getItem("staff_token");
                const isPrivileged = !!(adminToken || staffToken);

                if (isPrivileged) {
                    try {
                        const ordRes = await axiosInstance.get("/order");
                        const ordersData = Array.isArray(ordRes.data)
                            ? ordRes.data
                            : ordRes.data?.data || [];
                        setOrders(ordersData);
                        console.log("📋 Orders loaded:", ordersData.length);
                    } catch (ordErr) {
                        console.log("ℹ️ Cannot load orders:", ordErr.message);
                        setOrders([]);
                    }
                }

                console.log("✅ Initial data loaded successfully!");
            } catch (err) {
                console.error("❌ Error loading initial data:", err);
                setError(err.message || "Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, []); // Chỉ chạy 1 lần khi mount

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
                    console.log("📦 Cart loaded from storage:", parsed.length);
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
                try {
                    const newCart = JSON.parse(e.newValue);
                    if (Array.isArray(newCart)) {
                        setCart(newCart);
                        cartCacheRef.current = newCart;
                        console.log("🔄 Cart synced across tabs");
                    }
                } catch (err) {
                    console.error("Failed to parse cart data:", err);
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
            if (exist) {
                return prev.map((i) =>
                    i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prev, { ...product, quantity: 1 }];
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
    // 🧾 CREATE ORDER
    // ------------------------------
    const createOrder = async (tableId) => {
        const adminToken = localStorage.getItem("admin_token");
        const staffToken = localStorage.getItem("staff_token");

        if (!adminToken && !staffToken) {
            alert("❌ Không có quyền tạo đơn hàng!");
            return null;
        }

        if (cart.length === 0) {
            alert("🛒 Giỏ hàng trống!");
            return null;
        }

        try {
            console.log("📝 Creating order for table:", tableId);

            const orderRes = await axiosInstance.post("/order", {
                tableId: parseInt(tableId),
                note: "",
                items: cart.map(item => ({
                    foodId: item.id,
                    quantity: item.quantity,
                    note: item.note || "",
                })),
            });

            const order = orderRes.data;
            console.log("✅ Order created successfully:", order.id);

            clearCart();

            // Redirect based on role
            if (adminToken) {
                window.location.href = "/admin/orders";
            } else if (staffToken) {
                window.location.href = "/staff/orders";
            }

            return order;
        } catch (err) {
            console.error("❌ Order creation error:", err);
            const message = err.response?.data?.message || err.message;
            alert(`Tạo đơn hàng thất bại: ${message}`);
            throw err;
        }
    };

    // ------------------------------
    // 📜 FETCH USER ORDERS
    // ------------------------------
    const fetchMyOrders = useCallback(async () => {
        const userToken = localStorage.getItem("user_token");
        if (!userToken) {
            console.log("No user token found");
            return [];
        }

        try {
            const res = await axiosInstance.get("/order");
            const orders = Array.isArray(res.data) ? res.data : res.data?.data || [];
            console.log("📋 My orders fetched:", orders.length);
            return orders;
        } catch (err) {
            console.error("❌ Error fetching my orders:", err);
            return [];
        }
    }, []);

    // ------------------------------
    // 🪑 FETCH TABLES
    // ------------------------------
    const fetchTables = useCallback(async () => {
        try {
            const res = await axiosInstance.get("/table");
            const data = res.data?.data || res.data;
            const tablesData = Array.isArray(data) ? data : [];
            setTables(tablesData);
            return tablesData;
        } catch (err) {
            console.error("❌ Error fetching tables:", err);
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