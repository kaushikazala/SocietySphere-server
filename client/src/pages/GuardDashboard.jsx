import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { COLORS, FONTS } from "../theme";
import { Card, Button, Badge, Input } from "../components/Common";

const GuardDashboard = ({ user }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    visitorsToday: 0,
    approved: 0,
    pendingQR: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/auth?mode=login");
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch visitors for today
      const today = new Date().toISOString().split('T')[0];
      const visitorsRes = await fetch(`/api/visitors?date=${today}`, { headers });
      const visitorsData = await visitorsRes.json();
      
      const visitors = visitorsData.visitors || [];
      const visitorsToday = visitors.length;
      const approved = visitors.filter(v => v.status === "approved").length;
      const pendingQR = visitors.filter(v => v.status === "pending" && v.qrCode).length;
      const rejected = visitors.filter(v => v.status === "rejected").length;

      setStats({
        visitorsToday,
        approved,
        pendingQR,
        rejected,
      });
    } catch (error) {
      console.error("Error fetching guard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "32px" }}>
      <div
        style={{
          marginBottom: "32px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
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
            Gate Management
          </h1>
          <p style={{ fontSize: "14px", color: COLORS.muted }}>
            Visitor tracking and entry management
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
        {[
          { icon: "📲", label: "Visitors Today", value: loading ? "..." : stats.visitorsToday.toString() },
          { icon: "✅", label: "Approved", value: loading ? "..." : stats.approved.toString() },
          { icon: "⏳", label: "Pending QR", value: loading ? "..." : stats.pendingQR.toString() },
          { icon: "🚫", label: "Rejected", value: loading ? "..." : stats.rejected.toString() },
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

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: "16px" }}>
        {["overview", "visitors", "scan", "history"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 16px",
              background: activeTab === tab ? COLORS.jadedim : "transparent",
              border: activeTab === tab ? `1px solid ${COLORS.jade}` : "none",
              borderRadius: "8px",
              color: activeTab === tab ? COLORS.jade : COLORS.muted,
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "overview" && <GuardOverview />}
      {activeTab === "visitors" && <VisitorApprovals />}
      {activeTab === "scan" && <QRScanner />}
      {activeTab === "history" && <VisitorHistory />}
    </div>
  );
};

const GuardOverview = () => (
  <div style={{ display: "grid", gap: "24px" }}>
    <Card>
      <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
        Pending Approvals
      </h3>
      {[
        { name: "Rahul Sharma", flat: "201", arrival: "Today 2:00 PM", purpose: "Personal Visit" },
        { name: "Priya Singh", flat: "305", arrival: "Today 3:30 PM", purpose: "Delivery" },
        { name: "Amit Patel", flat: "401", arrival: "Tomorrow 10:00 AM", purpose: "Maintenance" },
      ].map((visitor) => (
        <div
          key={visitor.name}
          style={{
            padding: "12px",
            background: COLORS.bg,
            borderRadius: "8px",
            marginBottom: "8px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: COLORS.text }}>
              {visitor.name}
            </div>
            <Badge color="gold">Pending</Badge>
          </div>
          <div style={{ fontSize: "12px", color: COLORS.muted, marginBottom: "4px" }}>
            Flat {visitor.flat} • {visitor.arrival}
          </div>
          <div style={{ fontSize: "12px", color: COLORS.muted }}>
            Purpose: {visitor.purpose}
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <Button variant="primary" size="sm" style={{ flex: 1 }}>
              Approve
            </Button>
            <Button variant="secondary" size="sm" style={{ flex: 1 }}>
              Reject
            </Button>
          </div>
        </div>
      ))}
    </Card>
  </div>
);

const VisitorApprovals = () => (
  <Card>
    <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
      Approved Visitors
    </h3>
    {[
      { name: "Rahul Sharma", flat: "201", qr: "Generated", time: "2:00 PM" },
      { name: "Priya Singh", flat: "305", qr: "Generated", time: "3:30 PM" },
      { name: "Amit Patel", flat: "401", qr: "Generated", time: "10:00 AM" },
    ].map((visitor) => (
      <div
        key={visitor.name}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px",
          background: COLORS.bg,
          borderRadius: "8px",
          marginBottom: "8px",
        }}
      >
        <div>
          <div style={{ fontSize: "13px", color: COLORS.text }}>{visitor.name}</div>
          <div style={{ fontSize: "12px", color: COLORS.muted }}>Flat {visitor.flat}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <Badge color="jade">✓ QR Ready</Badge>
          <div style={{ fontSize: "11px", color: COLORS.muted, marginTop: "4px" }}>
            {visitor.time}
          </div>
        </div>
      </div>
    ))}
  </Card>
);

const QRScanner = () => (
  <Card>
    <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
      Scan Visitor QR
    </h3>
    <div style={{ height: "300px", background: COLORS.bg, borderRadius: "8px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
      <div style={{ fontSize: "48px", marginBottom: "12px" }}>📱</div>
      <span style={{ color: COLORS.muted }}>QR Scanner (Camera placeholder)</span>
      <span style={{ fontSize: "12px", color: COLORS.muted, marginTop: "8px" }}>
        Allow camera access to scan QR codes
      </span>
    </div>
    <Button variant="primary" style={{ width: "100%", padding: "10px" }}>
      Start Camera
    </Button>
  </Card>
);

const VisitorHistory = () => (
  <Card>
    <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
      Today's Entry Log
    </h3>
    {[
      { name: "Rahul Sharma", flat: "201", entry: "2:05 PM", exit: "3:30 PM", status: "Completed" },
      { name: "Priya Singh", flat: "305", entry: "3:35 PM", exit: "—", status: "In Society" },
      { name: "Ravi Kumar", flat: "202", entry: "12:15 PM", exit: "1:45 PM", status: "Completed" },
    ].map((entry) => (
      <div
        key={entry.name}
        style={{
          padding: "12px",
          background: COLORS.bg,
          borderRadius: "8px",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <div style={{ fontSize: "13px", fontWeight: 600, color: COLORS.text }}>
            {entry.name}
          </div>
          <Badge color={entry.status === "Completed" ? "jade" : "gold"}>
            {entry.status}
          </Badge>
        </div>
        <div style={{ fontSize: "12px", color: COLORS.muted }}>
          Flat {entry.flat} • Entry: {entry.entry} • Exit: {entry.exit}
        </div>
      </div>
    ))}
  </Card>
);

export default GuardDashboard;
