import React, { useState, useEffect } from "react";
import { COLORS, FONTS } from "../theme";
import { Card, Button, Badge, Input } from "../components/Common";

const ResidentDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    dueAmount: 0,
    openComplaints: 0,
    pendingApprovals: 0,
    newNotices: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch complaints
      const complaintsRes = await fetch("/api/complaints", { headers });
      const complaintsData = await complaintsRes.json();
      const openComplaints = complaintsData.complaints?.filter(c => 
        ["submitted", "acknowledged", "assigned", "in_progress"].includes(c.status)
      ).length || 0;

      // Fetch maintenance bills
      const billsRes = await fetch("/api/maintenance/bills", { headers });
      const billsData = await billsRes.json();
      const dueAmount = billsData.bills?.reduce((sum, bill) => 
        bill.status === "unpaid" ? sum + bill.amount : sum, 0
      ) || 0;

      // Fetch notices
      const noticesRes = await fetch("/api/notices", { headers });
      const noticesData = await noticesRes.json();
      const newNotices = noticesData.notices?.filter(n => !n.readBy?.includes(user._id)).length || 0;

      // For now, pending approvals is 0 (can be implemented later for visitor requests, etc.)
      setStats({
        dueAmount,
        openComplaints,
        pendingApprovals: 0,
        newNotices,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontFamily: FONTS.serif,
            fontSize: "32px",
            fontWeight: 700,
            color: COLORS.text,
            marginBottom: "8px",
          }}
        >
          Welcome back, {user?.name || "Resident"}
        </h1>
        <p style={{ fontSize: "14px", color: COLORS.muted }}>
          Here's your society overview
        </p>
      </div>

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
        {[
          { icon: "💳", label: "Due Amount", value: loading ? "..." : `₹${stats.dueAmount.toLocaleString()}` },
          { icon: "📋", label: "Open Complaints", value: loading ? "..." : stats.openComplaints.toString() },
          { icon: "✅", label: "Pending Approvals", value: loading ? "..." : stats.pendingApprovals.toString() },
          { icon: "📢", label: "New Notices", value: loading ? "..." : stats.newNotices.toString() },
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
        {["overview", "complaints", "visitors", "payments"].map((tab) => (
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
      {activeTab === "overview" && <ResidentOverview />}
      {activeTab === "complaints" && <ResidentComplaints />}
      {activeTab === "visitors" && <ResidentVisitors />}
      {activeTab === "payments" && <ResidentPayments />}
    </div>
  );
};

const ResidentOverview = () => (
  <div style={{ display: "grid", gap: "24px" }}>
    <Card>
      <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
        Maintenance Bill
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div>
          <div style={{ fontSize: "12px", color: COLORS.muted }}>Amount</div>
          <div style={{ fontSize: "18px", fontWeight: 600, color: COLORS.text }}>₹4,500</div>
        </div>
        <div>
          <div style={{ fontSize: "12px", color: COLORS.muted }}>Due Date</div>
          <div style={{ fontSize: "18px", fontWeight: 600, color: COLORS.danger }}>
            25th May
          </div>
        </div>
      </div>
      <Button variant="primary" style={{ width: "100%", marginTop: "16px", padding: "10px" }}>
        Pay Now
      </Button>
    </Card>

    <Card>
      <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
        Recent Notices
      </h3>
      {["Notice", "Alert", "Announcement"].map((notice) => (
        <div
          key={notice}
          style={{
            padding: "12px",
            background: COLORS.bg,
            borderRadius: "8px",
            marginBottom: "8px",
            fontSize: "13px",
            color: COLORS.text,
          }}
        >
          <Badge color="jade" style={{ marginRight: "8px" }}>
            {notice}
          </Badge>
          <span style={{ color: COLORS.muted }}>Important notice about {notice.toLowerCase()}</span>
        </div>
      ))}
    </Card>
  </div>
);

const ResidentComplaints = () => (
  <Card>
    <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
      File a Complaint
    </h3>
    <Input label="Category" placeholder="Select category" />
    <Input label="Title" placeholder="Brief description" />
    <Input label="Description" placeholder="Detailed description" />
    <Button variant="primary" style={{ width: "100%", marginTop: "16px", padding: "10px" }}>
      Submit Complaint
    </Button>
  </Card>
);

const ResidentVisitors = () => (
  <Card>
    <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
      Pre-Approve Visitors
    </h3>
    <Input label="Visitor Name" placeholder="Full name" />
    <Input label="Phone Number" placeholder="+91 98765 43210" />
    <Input label="Expected Date" type="date" />
    <Button variant="primary" style={{ width: "100%", marginTop: "16px", padding: "10px" }}>
      Send Pre-Approval
    </Button>
  </Card>
);

const ResidentPayments = () => (
  <Card>
    <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
      Payment History
    </h3>
    {[
      { date: "15 May 2025", amount: "₹4,500", status: "Paid" },
      { date: "15 Apr 2025", amount: "₹4,500", status: "Paid" },
      { date: "15 Mar 2025", amount: "₹4,500", status: "Paid" },
    ].map((payment) => (
      <div
        key={payment.date}
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
          <div style={{ fontSize: "13px", color: COLORS.text }}>{payment.date}</div>
          <div style={{ fontSize: "12px", color: COLORS.muted }}>Maintenance Bill</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: COLORS.text }}>
            {payment.amount}
          </div>
          <Badge color="jade">✓ {payment.status}</Badge>
        </div>
      </div>
    ))}
  </Card>
);

export default ResidentDashboard;
