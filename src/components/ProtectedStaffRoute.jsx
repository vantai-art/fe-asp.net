import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

function ProtectedStaffRoute({ children }) {
    const [loading, setLoading] = useState(true);
    const [isValid, setIsValid] = useState(false);

    const token = localStorage.getItem("staff_token");
    const role = localStorage.getItem("staff_role");
    const userString = localStorage.getItem("staff_user");

    let user = null;
    try {
        user = userString ? JSON.parse(userString) : null;
    } catch {
        user = null;
    }

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setIsValid(false);
                setLoading(false);
                return;
            }

            try {
                const res = await axios.get("https://chuyen-de-asp.onrender.com/api/auth/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.status === 200) {
                    setIsValid(true);
                } else {
                    setIsValid(false);
                }
            } catch {
                // Token không hợp lệ
                localStorage.removeItem("staff_token");
                localStorage.removeItem("staff_user");
                localStorage.removeItem("staff_role");
                setIsValid(false);
            } finally {
                setLoading(false);
            }
        };

        validateToken();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <p>Đang xác thực nhân viên...</p>
            </div>
        );
    }

    if (!token || !isValid) {
        return <Navigate to="/staff/login" replace />;
    }

    // Cho phép role STAFF, EMPLOYEE, ADMIN
    const allowedRoles = ["STAFF", "EMPLOYEE", "ADMIN"];
    const currentRole = (role || user?.role || "").toUpperCase();

    if (!allowedRoles.includes(currentRole)) {
        localStorage.removeItem("staff_token");
        localStorage.removeItem("staff_user");
        localStorage.removeItem("staff_role");
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedStaffRoute;
