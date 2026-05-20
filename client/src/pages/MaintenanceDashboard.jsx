import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { COLORS, FONTS } from "../theme";
import { Card, Button, Badge } from "../components/Common";

const MaintenanceDashboard = ({ user }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    openTasks: 0,
    completedTasks: 0,
    pendingApprovals: 0,
    urgentRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const tasksRes = await fetch("/api/maintenance/tasks", { headers });
      const tasksData = await tasksRes.json();
      const tasks = tasksData.tasks || [];

      const openTasks = tasks.filter((task) => task.status === "open").length;
      const completedTasks = tasks.filter((task) => task.status === "completed").length;
      const pendingApprovals = tasks.filter((task) => task.priority === "high" && task.status === "open").length;
      const urgentRequests = tasks.filter((task) => task.priority === "urgent").length;

      setStats({ openTasks, completedTasks, pendingApprovals, urgentRequests });
    } catch (error) {
      console.error("Error fetching maintenance stats:", error);
      setStats({ openTasks: 0, completedTasks: 0, pendingApprovals: 0, urgentRequests: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth?mode=login");
  };

  return (
    <div style={{ padding: "32px" }}>
      <div
        style={{
          marginBottom: "32px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: FONTS.serif,
              fontSize: "32px",
              fontWeight: 700,
              color: COLORS.text,
              marginBottom: "8px",
            }}
          >
            Maintenance Dashboard
          </h1>
          <p style={{ fontSize: "14px", color: COLORS.muted }}>
            Welcome back, {user?.name || "Maintenance"}. Manage repairs, service requests, and society upkeep.
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {user?.society && (
        <Card style={{ padding: "20px", marginBottom: "24px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "20px",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  color: COLORS.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: "8px",
                }}
              >
                Current Society
              </div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: COLORS.text }}>
                {user.society?.name || user.society}
              </div>
              <div style={{ fontSize: "13px", color: COLORS.muted, marginTop: "6px" }}>
                {user.society?.address?.city && user.society?.address?.state
                  ? `${user.society.address.city}, ${user.society.address.state}`
                  : ""}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "11px",
                  color: COLORS.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: "8px",
                }}
              >
                Society Code
              </div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: COLORS.jade }}>
                {user.society?.code || "—"}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
        {[
          { icon: "🛠️", label: "Open Tasks", value: loading ? "..." : stats.openTasks.toString() },
          { icon: "✅", label: "Completed", value: loading ? "..." : stats.completedTasks.toString() },
          { icon: "⚠️", label: "High Priority", value: loading ? "..." : stats.pendingApprovals.toString() },
          { icon: "🚨", label: "Urgent Requests", value: loading ? "..." : stats.urgentRequests.toString() },
        ].map((stat) => (
          <Card key={stat.label} style={{ padding: "20px" }}>
            <div style={{ fontSize: "24px", marginBottom: "12px" }}>{stat.icon}</div>
            <div style={{ fontSize: "12px", color: COLORS.muted, marginBottom: "6px" }}>
              {stat.label}
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: COLORS.jade,
              }}
            >
              {stat.value}
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <Card>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
            Recent Service Requests
          </h3>
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              style={{
                padding: "12px",
                background: COLORS.bg,
                borderRadius: "8px",
                marginBottom: "10px",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: 600, color: COLORS.text }}>
                Request #{index + 1}
              </div>
              <div style={{ fontSize: "12px", color: COLORS.muted, marginTop: "4px" }}>
                Replace light fitting in Block B, Flat 401
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
            Quick Actions
          </h3>
          <Button variant="primary" style={{ width: "100%", marginBottom: "12px", padding: "12px" }}>
            View Assigned Tasks
          </Button>
          <Button variant="secondary" style={{ width: "100%", padding: "12px" }}>
            Create Maintenance Report
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default MaintenanceDashboard;
