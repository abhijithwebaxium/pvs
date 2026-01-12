import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../store/slices/userSlice";
import { API_URL } from "../config/api";

const useDashboardStats = () => {
  const [stats, setStats] = useState({
    staffCount: 0,
    branchCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get user from Redux to access token
  const user = useSelector(selectUser);
  // Fallback to localStorage if Redux state is not yet populated (though it should be)
  const token = user?.token || localStorage.getItem("token");

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch employees count
        const employeesResponse = await fetch(`${API_URL}/api/employees`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        // Fetch branches count
        const branchesResponse = await fetch(`${API_URL}/api/branches`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!employeesResponse.ok) {
          throw new Error(
            `Failed to fetch employees: ${employeesResponse.statusText}`
          );
        }
        if (!branchesResponse.ok) {
          throw new Error(
            `Failed to fetch branches: ${branchesResponse.statusText}`
          );
        }

        const employeesData = await employeesResponse.json();
        const branchesData = await branchesResponse.json();

        setStats({
          staffCount: employeesData.count || 0,
          branchCount: branchesData.count || 0,
        });
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError(err.message || "Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  return { ...stats, loading, error };
};

export default useDashboardStats;
