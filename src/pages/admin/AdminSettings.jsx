import React, { useState, useEffect } from "react";
import { Save, Globe, Bell, Palette, Package, Loader2, AlertCircle } from "lucide-react";
import { useAppContext } from "../../contexts/AppContext";

function AdminSettings() {
    const { axiosInstance } = useAppContext();
    const [settings, setSettings] = useState({
        // Thông tin chung
        storeName: "Coffee Blend",
        storeEmail: "contact@coffeeblend.vn",
        storePhone: "0328778198",
        storeAddress: "2/60, Thủ Đức, TP.HCM",

        // Cài đặt thông báo
        emailNotifications: true,
        orderNotifications: true,
        promotionNotifications: false,

        // Cài đặt cửa hàng
        currency: "VND",
        timezone: "Asia/Ho_Chi_Minh",
        language: "vi",
        taxRate: 10,

        // Giao diện
        themeColor: "#D97706",
        darkMode: false,

        // Vận chuyển
        freeShippingThreshold: 200000,
        shippingFee: 30000,
    });

    const [saved, setSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    const getToken = () => localStorage.getItem("admin_token") || localStorage.getItem("staff_token");

    // Fetch settings from API
    const fetchSettings = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = getToken();
            if (!token) {
                throw new Error("Không tìm thấy token xác thực");
            }

            const response = await axiosInstance.get('/settings', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = response.data?.data || response.data;

            // If settings exist in database, use them
            if (data) {
                // Convert array of settings to object
                let settingsObj = {};
                if (Array.isArray(data)) {
                    data.forEach(item => {
                        settingsObj[item.key] = item.value;
                    });
                } else {
                    settingsObj = data;
                }

                // Parse JSON strings and convert types
                const parsedSettings = {};
                Object.keys(settingsObj).forEach(key => {
                    try {
                        parsedSettings[key] = JSON.parse(settingsObj[key]);
                    } catch {
                        parsedSettings[key] = settingsObj[key];
                    }
                });

                setSettings(prev => ({ ...prev, ...parsedSettings }));

                // Apply to localStorage and DOM
                if (parsedSettings.themeColor) {
                    localStorage.setItem("themeColor", parsedSettings.themeColor);
                }
                if (parsedSettings.darkMode !== undefined) {
                    localStorage.setItem("darkMode", parsedSettings.darkMode);
                }
            }
        } catch (err) {
            console.error("❌ Lỗi tải cài đặt:", err);

            // If API not available, load from localStorage
            const localThemeColor = localStorage.getItem("themeColor");
            const localDarkMode = localStorage.getItem("darkMode");

            if (localThemeColor || localDarkMode) {
                setSettings(prev => ({
                    ...prev,
                    themeColor: localThemeColor || prev.themeColor,
                    darkMode: localDarkMode === "true"
                }));
            }

            // Only show error if it's not a 404 (settings might not exist yet)
            if (err.response?.status !== 404) {
                setError("Không thể tải cài đặt. Sử dụng cài đặt mặc định.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Save settings to API
    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        try {
            const token = getToken();
            if (!token) {
                throw new Error("Không tìm thấy token xác thực");
            }

            // Convert settings object to array format for API
            const settingsArray = Object.keys(settings).map(key => ({
                key: key,
                value: typeof settings[key] === 'object'
                    ? JSON.stringify(settings[key])
                    : String(settings[key])
            }));

            // Try to update existing settings
            await axiosInstance.put('/settings', settingsArray, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }).catch(async (updateErr) => {
                // If PUT fails (404), try POST to create
                if (updateErr.response?.status === 404) {
                    await axiosInstance.post('/settings', settingsArray, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                } else {
                    throw updateErr;
                }
            });

            // Save to localStorage as backup
            localStorage.setItem("darkMode", settings.darkMode);
            localStorage.setItem("themeColor", settings.themeColor);

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);

        } catch (err) {
            console.error("❌ Lỗi lưu cài đặt:", err);

            // Fallback: save to localStorage only
            localStorage.setItem("darkMode", settings.darkMode);
            localStorage.setItem("themeColor", settings.themeColor);

            setError(
                "Không thể lưu vào database. Đã lưu vào bộ nhớ local. " +
                (err.response?.data?.message || err.message)
            );

            // Still show success for UX
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    // Load settings on mount
    useEffect(() => {
        fetchSettings();
    }, []);

    // ✅ Cập nhật giao diện toàn app khi darkMode hoặc themeColor thay đổi
    useEffect(() => {
        document.documentElement.classList.toggle("dark", settings.darkMode);
        document.documentElement.style.setProperty("--theme-color", settings.themeColor);
    }, [settings.darkMode, settings.themeColor]);

    const themeColors = [
        { value: "#D97706", name: "Cam" },
        { value: "#DC2626", name: "Đỏ" },
        { value: "#3B82F6", name: "Xanh Dương" },
        { value: "#10B981", name: "Xanh Lá" },
        { value: "#8B5CF6", name: "Tím" },
        { value: "#EC4899", name: "Hồng" },
    ];

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Đang tải cài đặt...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white text-black dark:bg-gray-900 dark:text-white min-h-screen transition-colors duration-500">
            {/* Header */}
            <div className="mb-8">
                <h1
                    className="text-3xl font-bold mb-2 transition-colors"
                    style={{ color: settings.themeColor }}
                >
                    Cài Đặt Hệ Thống
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Quản lý cấu hình và tùy chỉnh hệ thống
                </p>
            </div>

            {/* Thông báo lưu thành công */}
            {saved && (
                <div className="mb-6 bg-green-500/20 border border-green-500 text-green-400 px-6 py-4 rounded-lg flex items-center gap-3 animate-fadeIn">
                    <Save className="w-5 h-5" />
                    <span>✅ Cài đặt đã được lưu thành công!</span>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="mb-6 bg-yellow-500/20 border border-yellow-500 text-yellow-400 px-6 py-4 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold mb-1">Cảnh báo</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}

            {/* Các khối nội dung */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 🏪 Thông Tin Chung */}
                <Section
                    icon={<Globe className="w-6 h-6 text-amber-500" />}
                    title="Thông Tin Chung"
                    desc="Thông tin cơ bản về cửa hàng"
                >
                    <Input
                        label="Tên Cửa Hàng"
                        value={settings.storeName}
                        onChange={(v) => setSettings({ ...settings, storeName: v })}
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={settings.storeEmail}
                        onChange={(v) => setSettings({ ...settings, storeEmail: v })}
                    />
                    <Input
                        label="Số Điện Thoại"
                        type="tel"
                        value={settings.storePhone}
                        onChange={(v) => setSettings({ ...settings, storePhone: v })}
                    />
                    <Textarea
                        label="Địa Chỉ"
                        value={settings.storeAddress}
                        onChange={(v) => setSettings({ ...settings, storeAddress: v })}
                    />
                </Section>

                {/* 🔔 Thông Báo */}
                <Section
                    icon={<Bell className="w-6 h-6 text-blue-500" />}
                    title="Thông Báo"
                    desc="Cài đặt thông báo hệ thống"
                >
                    {[
                        { label: "Thông Báo Email", key: "emailNotifications" },
                        { label: "Thông Báo Đơn Hàng", key: "orderNotifications" },
                        { label: "Thông Báo Khuyến Mãi", key: "promotionNotifications" },
                    ].map((item) => (
                        <ToggleRow
                            key={item.key}
                            label={item.label}
                            checked={settings[item.key]}
                            onChange={() =>
                                setSettings({ ...settings, [item.key]: !settings[item.key] })
                            }
                            color={settings.themeColor}
                        />
                    ))}
                </Section>

                {/* ⚙️ Cài Đặt Cửa Hàng */}
                <Section
                    icon={<Package className="w-6 h-6 text-green-500" />}
                    title="Cài Đặt Cửa Hàng"
                    desc="Ngôn ngữ, thuế và định dạng"
                >
                    <Select
                        label="Ngôn Ngữ"
                        value={settings.language}
                        onChange={(v) => setSettings({ ...settings, language: v })}
                        options={[
                            { value: "vi", label: "Tiếng Việt" },
                            { value: "en", label: "English" },
                        ]}
                    />
                    <Input
                        label="Múi Giờ"
                        value={settings.timezone}
                        onChange={(v) => setSettings({ ...settings, timezone: v })}
                    />
                    <Input
                        label="Thuế (%)"
                        type="number"
                        value={settings.taxRate}
                        onChange={(v) => setSettings({ ...settings, taxRate: parseInt(v) || 0 })}
                    />
                </Section>

                {/* 🎨 Giao Diện */}
                <Section
                    icon={<Palette className="w-6 h-6 text-purple-500" />}
                    title="Giao Diện"
                    desc="Tùy chỉnh màu sắc và chế độ giao diện"
                >
                    <label className="block mb-3 font-medium">Màu Chủ Đạo</label>
                    <div className="flex gap-3 flex-wrap mb-5">
                        {themeColors.map((color) => (
                            <button
                                key={color.value}
                                onClick={() =>
                                    setSettings({ ...settings, themeColor: color.value })
                                }
                                className={`w-10 h-10 rounded-lg border-2 transform transition-all duration-300 hover:scale-110 ${settings.themeColor === color.value
                                    ? "border-white scale-110 shadow-lg"
                                    : "border-transparent"
                                    }`}
                                style={{
                                    backgroundColor: color.value,
                                    boxShadow:
                                        settings.themeColor === color.value
                                            ? `0 0 10px ${color.value}aa`
                                            : "none",
                                }}
                                title={color.name}
                            />
                        ))}
                    </div>

                    <ToggleRow
                        label="Chế Độ Tối"
                        checked={settings.darkMode}
                        onChange={() =>
                            setSettings({ ...settings, darkMode: !settings.darkMode })
                        }
                        color={settings.themeColor}
                    />
                </Section>
            </div>

            {/* 🧾 Nút Lưu */}
            <div className="mt-8 flex justify-end gap-3">
                <button
                    onClick={fetchSettings}
                    disabled={isLoading || isSaving}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    Tải lại
                </button>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: settings.themeColor }}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Đang lưu...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Lưu Cài Đặt
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

/* === COMPONENTS PHỤ === */
const Section = ({ icon, title, desc, children }) => (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-6 transition-all">
        <div className="flex items-center gap-3 mb-6">
            <div className="bg-[var(--theme-color)]/20 p-3 rounded-lg">{icon}</div>
            <div>
                <h2 className="text-xl font-bold">{title}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{desc}</p>
            </div>
        </div>
        <div className="space-y-4">{children}</div>
    </div>
);

const Input = ({ label, type = "text", value, onChange }) => (
    <div>
        <label className="block mb-2 font-medium">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-gray-200 dark:bg-gray-700 text-black dark:text-white px-4 py-3 rounded border border-gray-300 dark:border-gray-600 focus:border-[var(--theme-color)] outline-none transition"
        />
    </div>
);

const Textarea = ({ label, value, onChange }) => (
    <div>
        <label className="block mb-2 font-medium">{label}</label>
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={2}
            className="w-full bg-gray-200 dark:bg-gray-700 text-black dark:text-white px-4 py-3 rounded border border-gray-300 dark:border-gray-600 focus:border-[var(--theme-color)] outline-none transition"
        />
    </div>
);

const Select = ({ label, value, onChange, options }) => (
    <div>
        <label className="block mb-2 font-medium">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-gray-200 dark:bg-gray-700 text-black dark:text-white px-4 py-3 rounded border border-gray-300 dark:border-gray-600 focus:border-[var(--theme-color)] outline-none transition"
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    </div>
);

const ToggleRow = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-gray-200 dark:bg-gray-900 rounded-lg transition">
        <div>
            <div className="font-medium">{label}</div>
        </div>
        <button
            onClick={onChange}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${checked ? "bg-[var(--theme-color)]" : "bg-gray-500"
                }`}
        >
            <span
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${checked ? "translate-x-7" : ""
                    }`}
            />
        </button>
    </div>
);

export default AdminSettings;