import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
    useCallback,
} from "react";
import axios from "axios";

// ─── Tạo axiosInstance ở module level (không tạo trong component) ───────────
// Điều này đảm bảo interceptor không bị re-register mỗi lần render
const API_BASE = "https://chuyen-de-asp.onrender.com/api";

const axiosInstance = axios.create({
    baseURL: API_BASE,
    headers: { "Content-Type": "application/json" },
});

// Public endpoints không cần token
const publicEndpoints = ['/auth/login', '/auth/register', '/food', '/category', '/table'];
const isPublicEndpoint = (url) => {
    if (!url) return false;
    return publicEndpoints.some(endpoint => {
        // khớp chính xác (tránh /food/available bị coi là public)
        const path = url.split('?')[0]; // bỏ query string
        return path === endpoint || path.endsWith(endpoint);
    });
};

// ✅ Gắn request interceptor 1 lần duy nhất
axiosInstance.interceptors.request.use(
    (config) => {
        if (isPublicEndpoint(config.url)) {
            return config; // public → không cần token
        }
        const token =
            localStorage.getItem("admin_token") ||
            localStorage.getItem("staff_token") ||
            localStorage.getItem("user_token") ||
            localStorage.getItem("jwt_token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ✅ Gắn response interceptor 1 lần duy nhất
axiosInstance.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err.response?.status;
        const url = err.config?.url || "";

        if (isPublicEndpoint(url)) {
            return Promise.reject(err);
        }

        if (status === 401 || status === 403) {
            const path = window.location.pathname;
            if (path.startsWith("/admin")) {
                localStorage.removeItem("admin_token");
                localStorage.removeItem("admin_user");
                localStorage.removeItem("isAdminAuth");
                window.location.href = "/admin/login";
            } else if (path.startsWith("/staff")) {
                localStorage.removeItem("staff_token");
                localStorage.removeItem("staff_user");
                window.location.href = "/staff/login";
            }
        }
        return Promise.reject(err);
    }
);

// ─── Context ─────────────────────────────────────────────────────────────────
const AppContext = createContext();

export function AppProvider({ children }) {
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
    const cartCacheRef = useRef(null);

    // ─── Fetch dữ liệu ban đầu ───────────────────────────────────────────────
    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            setError(null);
            try {
                const [prodRes, catRes, tblRes] = await Promise.allSettled([
                    axiosInstance.get("/food"),
                    axiosInstance.get("/category"),
                    axiosInstance.get("/table"),
                ]);

                // Categories
                let categoriesData = [];
                if (catRes.status === "fulfilled" && catRes.value.data) {
                    categoriesData = Array.isArray(catRes.value.data)
                        ? catRes.value.data
                        : catRes.value.data.data || [];
                    setCategories(categoriesData);
                }

                // Products
                if (prodRes.status === "fulfilled" && prodRes.value.data) {
                    let productsData = Array.isArray(prodRes.value.data)
                        ? prodRes.value.data
                        : prodRes.value.data.data || [];

                    productsData = productsData.map((p) => ({
                        ...p,
                        category: categoriesData.find((c) => c.id === p.categoryId) || {
                            id: p.categoryId,
                            name: "Khác",
                        },
                    }));
                    setProducts(productsData);
                }

                // Tables
                if (tblRes.status === "fulfilled" && tblRes.value.data) {
                    const tablesData = Array.isArray(tblRes.value.data)
                        ? tblRes.value.data
                        : tblRes.value.data.data || [];
                    setTables(tablesData);
                }

                // Orders - chỉ khi đã đăng nhập admin/staff
                const adminToken = localStorage.getItem("admin_token");
                const staffToken = localStorage.getItem("staff_token");
                if (adminToken || staffToken) {
                    try {
                        const ordRes = await axiosInstance.get("/order");
                        const ordersData = Array.isArray(ordRes.data)
                            ? ordRes.data
                            : ordRes.data?.data || [];
                        setOrders(ordersData);
                    } catch {
                        setOrders([]);
                    }
                }
            } catch (err) {
                setError(err.message || "Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, []);

    // ─── Giỏ hàng ────────────────────────────────────────────────────────────
    useEffect(() => {
        try {
            const saved = localStorage.getItem("cart_data");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setCart(parsed);
                    cartCacheRef.current = parsed;
                }
            }
        } catch (e) {
            console.error("Cart load error:", e);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem("cart_data", JSON.stringify(cart));
            cartCacheRef.current = cart;
        } catch (e) {
            console.error("Cart save error:", e);
        }
    }, [cart]);

    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === "cart_data" && e.newValue) {
                try {
                    const newCart = JSON.parse(e.newValue);
                    if (Array.isArray(newCart)) setCart(newCart);
                } catch {}
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    // ─── Cart functions ───────────────────────────────────────────────────────
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

    // ─── Tạo đơn hàng ────────────────────────────────────────────────────────
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
            clearCart();
            if (adminToken) window.location.href = "/admin/orders";
            else if (staffToken) window.location.href = "/staff/orders";
            return order;
        } catch (err) {
            const message = err.response?.data?.message || err.message;
            alert(`Tạo đơn hàng thất bại: ${message}`);
            throw err;
        }
    };

    // ─── Fetch orders của user ────────────────────────────────────────────────
    const fetchMyOrders = useCallback(async () => {
        const userToken = localStorage.getItem("user_token");
        if (!userToken) return [];
        try {
            const res = await axiosInstance.get("/order");
            return Array.isArray(res.data) ? res.data : res.data?.data || [];
        } catch {
            return [];
        }
    }, []);

    // ─── Fetch tables ─────────────────────────────────────────────────────────
    const fetchTables = useCallback(async () => {
        try {
            const res = await axiosInstance.get("/table");
            const data = res.data?.data || res.data;
            const tablesData = Array.isArray(data) ? data : [];
            setTables(tablesData);
            return tablesData;
        } catch {
            return [];
        }
    }, []);

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

export const useAppContext = () => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useAppContext must be used within AppProvider");
    return ctx;
};
