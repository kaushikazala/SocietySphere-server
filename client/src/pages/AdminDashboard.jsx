import React, { useState, useEffect } from "react";
import { COLORS, FONTS } from "../theme";
import { Card, Button, Badge, Input } from "../components/Common";

const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalResidents: 0,
    duesCollected: 0,
    openComplaints: 0,
    parkingSlots: "0/0",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch society members
      const membersRes = await fetch(`/api/societies/${user.society}/members`, { headers });
      const membersData = await membersRes.json();
      const totalResidents = membersData.members?.filter(m => m.role === "resident").length || 0;

      // Fetch maintenance summary
      const summaryRes = await fetch("/api/maintenance/bills/summary", { headers });
      const summaryData = await summaryRes.json();
      const duesCollected = summaryData.summary?.find(s => s._id === "paid")?.total || 0;

      // Fetch complaints
      const complaintsRes = await fetch("/api/complaints", { headers });
      const complaintsData = await complaintsRes.json();
      const openComplaints = complaintsData.complaints?.filter(c => 
        ["submitted", "acknowledged", "assigned", "in_progress"].includes(c.status)
      ).length || 0;

      // For parking slots, we'll need to implement that API later
      // For now, show placeholder
      setStats({
        totalResidents,
        duesCollected,
        openComplaints,
        parkingSlots: "0/0", // TODO: implement parking API
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
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
          Admin Dashboard
        </h1>
        <p style={{ fontSize: "14px", color: COLORS.muted }}>
          Manage {user?.societyName || "your society"}
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
        {[
          { icon: "👥", label: "Total Residents", value: loading ? "..." : stats.totalResidents.toString() },
          { icon: "💰", label: "Dues Collected", value: loading ? "..." : `₹${stats.duesCollected.toLocaleString()}` },
          { icon: "📋", label: "Open Complaints", value: loading ? "..." : stats.openComplaints.toString() },
          { icon: "🚗", label: "Parking Slots", value: loading ? "..." : stats.parkingSlots },
        ].map((kpi) => (
          <Card key={kpi.label} style={{ padding: "20px" }}>
            <div style={{ fontSize: "24px", marginBottom: "12px" }}>{kpi.icon}</div>
            <div style={{ fontSize: "12px", color: COLORS.muted, marginBottom: "6px" }}>
              {kpi.label}
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: COLORS.jade,
              }}
            >
              {kpi.value}
            </div>
          </Card>
        ))}
      </div>

      {/* Society Creation for Super Admin */}
      {user.role === "super_admin" && !user.society && (
        <div style={{ marginTop: "32px" }}>
          <Card style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
              Create Your First Society
            </h3>
            <p style={{ color: COLORS.muted, marginBottom: "16px" }}>
              As a super admin, you can create societies for management.
            </p>
            <Button onClick={() => alert("Society creation form coming soon!")}>
              Create Society
            </Button>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: "16px" }}>
        {["overview", "residents", "billing", "complaints", "notices"].map((tab) => (
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
      {activeTab === "overview" && <AdminOverview />}
      {activeTab === "residents" && <ManageResidents />}
      {activeTab === "billing" && <BillingManagement />}
      {activeTab === "complaints" && <ComplaintManagement />}
      {activeTab === "notices" && <NoticeManagement />}
    </div>
  );
};

const AdminOverview = () => (
  <div style={{ display: "grid", gap: "24px" }}>
    <Card>
      <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
        Collection Status
      </h3>
      <div style={{ height: "200px", background: COLORS.bg, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: COLORS.muted }}>Chart placeholder</span>
      </div>
    </Card>

    <Card>
      <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
        Recent Activities
      </h3>
      {["Payment received", "New complaint filed", "Visitor check-in", "Notice posted"].map((activity) => (
        <div
          key={activity}
          style={{
            padding: "12px",
            background: COLORS.bg,
            borderRadius: "8px",
            marginBottom: "8px",
            fontSize: "13px",
            color: COLORS.text,
          }}
        >
          • {activity}
        </div>
      ))}
    </Card>
  </div>
);

const ManageResidents = () => (
  <div style={{ display: "grid", gap: "24px" }}>
    <Card>
      <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
        Add New Resident
      </h3>
      <Input label="Name" placeholder="Full name" />
      <Input label="Email" placeholder="email@example.com" />
      <Input label="Phone" placeholder="+91 98765 43210" />
      <Input label="Flat Number" placeholder="201" />
      <Button variant="primary" style={{ width: "100%", marginTop: "16px", padding: "10px" }}>
        Add Resident
      </Button>
    </Card>

    <Card>
      <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
        Resident List
      </h3>
      {[
        { name: "Ramesh Patel", flat: "201", phone: "+91 98765 43210" },
        { name: "Priya Sharma", flat: "202", phone: "+91 87654 32109" },
        { name: "Amit Kumar", flat: "203", phone: "+91 76543 21098" },
      ].map((resident) => (
        <div
          key={resident.name}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "12px",
            background: COLORS.bg,
            borderRadius: "8px",
            marginBottom: "8px",
          }}
        >
          <div>
            <div style={{ fontSize: "13px", color: COLORS.text }}>{resident.name}</div>
            <div style={{ fontSize: "12px", color: COLORS.muted }}>Flat {resident.flat}</div>
          </div>
          <div style={{ fontSize: "12px", color: COLORS.mutedlt }}>{resident.phone}</div>
        </div>
      ))}
    </Card>
  </div>
);

const BillingManagement = () => (
  <Card>
    <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
      Generate Maintenance Bill
    </h3>
    <Input label="Billing Month" type="month" />
    <Input label="Amount (per resident)" placeholder="₹4,500" />
    <div style={{ margin: "16px 0" }}>
      <label style={{ display: "block", fontSize: "12px", color: COLORS.mutedlt, marginBottom: "8px" }}>
        Include charges for:
      </label>
      {["Electricity", "Water", "Waste Management", "Security"].map((charge) => (
        <label
          key={charge}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
            fontSize: "13px",
            color: COLORS.text,
            cursor: "pointer",
          }}
        >
          <input type="checkbox" />
          {charge}
        </label>
      ))}
    </div>
    <Button variant="primary" style={{ width: "100%", padding: "10px" }}>
      Generate Bills
    </Button>
  </Card>
);

const ComplaintManagement = () => (
  <Card>
    <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
      Open Complaints
    </h3>
    {[
      { id: 1, title: "Plumbing issue", resident: "Flat 201", status: "Pending" },
      { id: 2, title: "Electrical fault", resident: "Flat 305", status: "In Progress" },
      { id: 3, title: "Water leak", resident: "Flat 401", status: "Pending" },
    ].map((complaint) => (
      <div
        key={complaint.id}
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
          <div style={{ fontSize: "13px", color: COLORS.text }}>{complaint.title}</div>
          <div style={{ fontSize: "12px", color: COLORS.muted }}>{complaint.resident}</div>
        </div>
        <Badge color={complaint.status === "Pending" ? "jade" : "gold"}>
          {complaint.status}
        </Badge>
      </div>
    ))}
  </Card>
);

const NoticeManagement = () => (
  <Card>
    <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
      Post New Notice
    </h3>
    <Input label="Title" placeholder="Notice title" />
    <Input
      label="Description"
      placeholder="Full notice content"
      style={{ minHeight: "100px" }}
    />
    <div style={{ margin: "16px 0" }}>
      <label style={{ display: "block", fontSize: "12px", color: COLORS.mutedlt, marginBottom: "8px" }}>
        Send via:
      </label>
      {["Push Notification", "Email", "SMS"].map((method) => (
        <label
          key={method}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
            fontSize: "13px",
            color: COLORS.text,
            cursor: "pointer",
          }}
        >
          <input type="checkbox" defaultChecked />
          {method}
        </label>
      ))}
    </div>
    <Button variant="primary" style={{ width: "100%", padding: "10px" }}>
      Post Notice
    </Button>
  </Card>
);

export default AdminDashboard;
