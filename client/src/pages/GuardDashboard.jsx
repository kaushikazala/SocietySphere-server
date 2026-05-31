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

const GuardOverview = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch("/api/visitors?status=pending", { headers });
      const data = await res.json();
      setVisitors(data.visitors || []);
    } catch (error) {
      console.error("Error fetching pending visitors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id) => {
    try {
      setActionLoading(id);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      await fetch(`/api/visitors/${id}/entry`, { method: "PATCH", headers });
      await fetchPending();
    } catch (error) {
      console.error("Error approving visitor:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    try {
      setActionLoading(id);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      await fetch(`/api/visitors/${id}`, { method: "DELETE", headers });
      await fetchPending();
    } catch (error) {
      console.error("Error rejecting visitor:", error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <Card>
        <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
          Pending Approvals
        </h3>
        {loading ? (
          <div style={{ padding: "24px", textAlign: "center", color: COLORS.muted, fontSize: "13px" }}>
            Loading pending visitors...
          </div>
        ) : visitors.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: COLORS.muted, fontSize: "13px" }}>
            No pending visitors at this time.
          </div>
        ) : (
          visitors.map((visitor) => (
            <div
              key={visitor._id}
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
                Flat {visitor.flat || visitor.flatNumber || "—"} • {visitor.visitDate ? new Date(visitor.visitDate).toLocaleString() : "—"}
              </div>
              <div style={{ fontSize: "12px", color: COLORS.muted }}>
                Purpose: {visitor.purpose || "—"}
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <Button
                  variant="primary"
                  size="sm"
                  style={{ flex: 1 }}
                  onClick={() => handleApprove(visitor._id)}
                  disabled={actionLoading === visitor._id}
                >
                  {actionLoading === visitor._id ? "Processing..." : "Approve"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  style={{ flex: 1 }}
                  onClick={() => handleReject(visitor._id)}
                  disabled={actionLoading === visitor._id}
                >
                  {actionLoading === visitor._id ? "Processing..." : "Reject"}
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
};

const VisitorApprovals = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApproved = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch("/api/visitors?status=approved", { headers });
        const data = await res.json();
        setVisitors(data.visitors || []);
      } catch (error) {
        console.error("Error fetching approved visitors:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchApproved();
  }, []);

  return (
    <Card>
      <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
        Approved Visitors
      </h3>
      {loading ? (
        <div style={{ padding: "24px", textAlign: "center", color: COLORS.muted, fontSize: "13px" }}>
          Loading approved visitors...
        </div>
      ) : visitors.length === 0 ? (
        <div style={{ padding: "24px", textAlign: "center", color: COLORS.muted, fontSize: "13px" }}>
          No approved visitors found.
        </div>
      ) : (
        visitors.map((visitor) => (
          <div
            key={visitor._id}
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
              <div style={{ fontSize: "12px", color: COLORS.muted }}>
                Flat {visitor.flat || visitor.flatNumber || "—"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <Badge color="jade">{visitor.qrCode ? "✓ QR Ready" : "Approved"}</Badge>
              <div style={{ fontSize: "11px", color: COLORS.muted, marginTop: "4px" }}>
                {visitor.visitDate ? new Date(visitor.visitDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
              </div>
            </div>
          </div>
        ))
      )}
    </Card>
  );
};

const QRScanner = () => {
  const [token, setToken] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState("");

  const handleScan = async () => {
    if (!token.trim()) return;
    try {
      setScanLoading(true);
      setScanError("");
      setScanResult(null);
      const authToken = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${authToken}` };
      const res = await fetch(`/api/visitors/scan/${token.trim()}`, { headers });
      const data = await res.json();
      if (!res.ok) {
        setScanError(data.message || "Invalid QR token");
      } else {
        setScanResult(data.visitor || data);
      }
    } catch (error) {
      console.error("Error scanning QR token:", error);
      setScanError("Failed to verify QR token. Please try again.");
    } finally {
      setScanLoading(false);
    }
  };

  return (
    <Card>
      <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
        Scan Visitor QR
      </h3>
      <div style={{ height: "200px", background: COLORS.bg, borderRadius: "8px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>📱</div>
        <span style={{ color: COLORS.muted }}>QR Scanner (Camera placeholder)</span>
        <span style={{ fontSize: "12px", color: COLORS.muted, marginTop: "8px" }}>
          Allow camera access to scan QR codes
        </span>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: COLORS.text, marginBottom: "8px" }}>
          Or enter QR token manually
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Input
            placeholder="Enter visitor QR token..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            style={{ flex: 1 }}
          />
          <Button variant="primary" size="md" onClick={handleScan} disabled={scanLoading || !token.trim()}>
            {scanLoading ? "Verifying..." : "Verify"}
          </Button>
        </div>
      </div>

      {scanError && (
        <div style={{ padding: "12px", background: "#fef2f2", borderRadius: "8px", marginBottom: "12px" }}>
          <div style={{ fontSize: "13px", color: "#dc2626" }}>❌ {scanError}</div>
        </div>
      )}

      {scanResult && (
        <div style={{ padding: "12px", background: COLORS.bg, borderRadius: "8px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: COLORS.text, marginBottom: "8px" }}>
            ✅ Visitor Verified
          </div>
          <div style={{ fontSize: "12px", color: COLORS.muted, marginBottom: "4px" }}>
            Name: {scanResult.name || "—"}
          </div>
          <div style={{ fontSize: "12px", color: COLORS.muted, marginBottom: "4px" }}>
            Flat: {scanResult.flat || scanResult.flatNumber || "—"}
          </div>
          <div style={{ fontSize: "12px", color: COLORS.muted, marginBottom: "4px" }}>
            Purpose: {scanResult.purpose || "—"}
          </div>
          <div style={{ fontSize: "12px", color: COLORS.muted }}>
            Status: <Badge color={scanResult.status === "approved" ? "jade" : "gold"}>{scanResult.status}</Badge>
          </div>
        </div>
      )}
    </Card>
  );
};

const VisitorHistory = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const today = new Date().toISOString().split("T")[0];
        const res = await fetch(`/api/visitors?date=${today}`, { headers });
        const data = await res.json();
        setEntries(data.visitors || []);
      } catch (error) {
        console.error("Error fetching visitor history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatTime = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getStatus = (entry) => {
    if (entry.exitTime) return "Completed";
    if (entry.entryTime) return "In Society";
    return entry.status || "Pending";
  };

  return (
    <Card>
      <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
        Today's Entry Log
      </h3>
      {loading ? (
        <div style={{ padding: "24px", textAlign: "center", color: COLORS.muted, fontSize: "13px" }}>
          Loading entry log...
        </div>
      ) : entries.length === 0 ? (
        <div style={{ padding: "24px", textAlign: "center", color: COLORS.muted, fontSize: "13px" }}>
          No entries recorded today.
        </div>
      ) : (
        entries.map((entry) => {
          const status = getStatus(entry);
          return (
            <div
              key={entry._id}
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
                <Badge color={status === "Completed" ? "jade" : "gold"}>
                  {status}
                </Badge>
              </div>
              <div style={{ fontSize: "12px", color: COLORS.muted }}>
                Flat {entry.flat || entry.flatNumber || "—"} • Entry: {formatTime(entry.entryTime)} • Exit: {formatTime(entry.exitTime)}
              </div>
            </div>
          );
        })
      )}
    </Card>
  );
};

export default GuardDashboard;
