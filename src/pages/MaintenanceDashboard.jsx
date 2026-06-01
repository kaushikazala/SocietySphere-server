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
  const [tasks, setTasks] = useState([]);
  const [showTasks, setShowTasks] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const tasksRes = await fetch("/api/maintenance/tasks", { headers });
      const tasksData = await tasksRes.json();
      const maintenanceTasks = tasksData.tasks || [];

      const openTasks = maintenanceTasks.filter((task) => task.status === "open").length;
      const completedTasks = maintenanceTasks.filter((task) => task.status === "completed").length;
      const pendingApprovals = maintenanceTasks.filter((task) => task.priority === "high" && task.status === "open").length;
      const urgentRequests = maintenanceTasks.filter((task) => task.priority === "urgent").length;

      setStats({ openTasks, completedTasks, pendingApprovals, urgentRequests });

      // Fetch complaints assigned to this maintenance user
      const complaintsRes = await fetch("/api/complaints", { headers });
      const complaintsData = await complaintsRes.json();
      setTasks(complaintsData.complaints || complaintsData || []);
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

  const handleUpdateStatus = async (complaintId, newStatus) => {
    try {
      setActionLoading(complaintId);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      await fetch(`/api/complaints/${complaintId}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchStats();
    } catch (error) {
      console.error("Error updating complaint status:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open": return "gold";
      case "in_progress": return "blue";
      case "resolved":
      case "completed": return "jade";
      default: return "gold";
    }
  };

  const recentTasks = tasks.filter((t) => t.status === "open" || t.status === "in_progress").slice(0, 5);

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

      {showTasks ? (
        <Card style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text }}>
              All Assigned Tasks
            </h3>
            <Button variant="secondary" size="sm" onClick={() => setShowTasks(false)}>
              Back to Overview
            </Button>
          </div>
          {loading ? (
            <div style={{ padding: "24px", textAlign: "center", color: COLORS.muted, fontSize: "13px" }}>
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: COLORS.muted, fontSize: "13px" }}>
              No tasks assigned to you.
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task._id}
                style={{
                  padding: "12px",
                  background: COLORS.bg,
                  borderRadius: "8px",
                  marginBottom: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: COLORS.text }}>
                    {task.title || task.subject || "Untitled Task"}
                  </div>
                  <Badge color={getStatusColor(task.status)}>
                    {task.status ? task.status.replace("_", " ") : "open"}
                  </Badge>
                </div>
                <div style={{ fontSize: "12px", color: COLORS.muted, marginBottom: "8px" }}>
                  {task.description || task.message || "No description provided."}
                </div>
                {task.flat && (
                  <div style={{ fontSize: "11px", color: COLORS.muted, marginBottom: "8px" }}>
                    Flat: {task.flat}
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px" }}>
                  {task.status === "open" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateStatus(task._id, "in_progress")}
                      disabled={actionLoading === task._id}
                    >
                      {actionLoading === task._id ? "Updating..." : "Mark In Progress"}
                    </Button>
                  )}
                  {(task.status === "open" || task.status === "in_progress") && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUpdateStatus(task._id, "resolved")}
                      disabled={actionLoading === task._id}
                    >
                      {actionLoading === task._id ? "Updating..." : "Mark Resolved"}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <Card>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
              Recent Service Requests
            </h3>
            {loading ? (
              <div style={{ padding: "24px", textAlign: "center", color: COLORS.muted, fontSize: "13px" }}>
                Loading requests...
              </div>
            ) : recentTasks.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: COLORS.muted, fontSize: "13px" }}>
                No open service requests.
              </div>
            ) : (
              recentTasks.map((task) => (
                <div
                  key={task._id}
                  style={{
                    padding: "12px",
                    background: COLORS.bg,
                    borderRadius: "8px",
                    marginBottom: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: COLORS.text }}>
                      {task.title || task.subject || "Service Request"}
                    </div>
                    <Badge color={getStatusColor(task.status)}>
                      {task.status ? task.status.replace("_", " ") : "open"}
                    </Badge>
                  </div>
                  <div style={{ fontSize: "12px", color: COLORS.muted, marginTop: "4px" }}>
                    {task.description || task.message || "No description provided."}
                  </div>
                  {task.flat && (
                    <div style={{ fontSize: "11px", color: COLORS.muted, marginTop: "4px" }}>
                      Flat: {task.flat}
                    </div>
                  )}
                </div>
              ))
            )}
          </Card>

          <Card>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
              Quick Actions
            </h3>
            <Button
              variant="primary"
              style={{ width: "100%", marginBottom: "12px", padding: "12px" }}
              onClick={() => setShowTasks(true)}
            >
              View Assigned Tasks ({tasks.filter((t) => t.status === "open" || t.status === "in_progress").length})
            </Button>
            <Button
              variant="secondary"
              style={{ width: "100%", padding: "12px" }}
              onClick={() => {
                const inProgressTask = tasks.find((t) => t.status === "in_progress");
                if (inProgressTask) {
                  handleUpdateStatus(inProgressTask._id, "resolved");
                } else {
                  alert("No in-progress tasks to resolve. Mark a task as 'In Progress' first.");
                }
              }}
              disabled={actionLoading !== null}
            >
              {actionLoading ? "Submitting..." : "Create Maintenance Report"}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MaintenanceDashboard;
