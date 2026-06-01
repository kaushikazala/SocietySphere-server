import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { COLORS, FONTS } from "../theme";
import { Card, Button, Badge, Input } from "../components/Common";

const ResidentDashboard = ({ user }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  // Database Data States
  const [stats, setStats] = useState({
    dueAmount: 0,
    openComplaints: 0,
    pendingApprovals: 0,
    newNotices: 0,
  });
  const [notices, setNotices] = useState([]);
  const [bills, setBills] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [notes, setNotes] = useState([]);

  // Form States
  const [complaintForm, setComplaintForm] = useState({ title: "", description: "", category: "infrastructure", priority: "medium" });
  const [complaintErrors, setComplaintErrors] = useState({});
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);

  const [visitorForm, setVisitorForm] = useState({ name: "", phone: "", purpose: "Personal", expectedDate: "" });
  const [visitorErrors, setVisitorErrors] = useState({});
  const [visitorSubmitting, setVisitorSubmitting] = useState(false);

  // Notes Form State
  const [noteForm, setNoteForm] = useState({ id: "", title: "", content: "" });
  const [noteErrors, setNoteErrors] = useState({});
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [noteEditMode, setNoteEditMode] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/auth?mode=login");
  };

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getHeaders();

      // 1. Fetch complaints
      const complaintsRes = await fetch("/api/complaints", { headers });
      const complaintsData = await complaintsRes.json();
      const userComplaints = complaintsData.complaints || [];
      setComplaints(userComplaints);

      // 2. Fetch bills
      const billsRes = await fetch("/api/maintenance/bills", { headers });
      const billsData = await billsRes.json();
      const userBills = billsData.bills || [];
      setBills(userBills);

      // 3. Fetch notices
      const noticesRes = await fetch("/api/notices", { headers });
      const noticesData = await noticesRes.json();
      const listNotices = noticesData.notices || [];
      setNotices(listNotices);

      // 4. Fetch visitors
      const visitorsRes = await fetch("/api/visitors", { headers });
      const visitorsData = await visitorsRes.json();
      const listVisitors = visitorsData.visitors || [];
      setVisitors(listVisitors);

      // 5. Fetch Notes
      const notesRes = await fetch("/api/notes", { headers });
      const notesData = await notesRes.json();
      const listNotes = notesData.notes || [];
      setNotes(listNotes);

      // 6. Aggregate Stats
      const openComplaintsCount = userComplaints.filter(c => 
        ["submitted", "acknowledged", "assigned", "in_progress"].includes(c.status)
      ).length;

      const dueAmountCount = userBills.reduce((sum, bill) => 
        bill.status === "pending" || bill.status === "Unpaid" ? sum + bill.amount : sum, 0
      );

      const unreadNoticesCount = listNotices.filter(n => !n.readBy?.includes(user?._id)).length;

      setStats({
        dueAmount: dueAmountCount,
        openComplaints: openComplaintsCount,
        pendingApprovals: listVisitors.filter(v => v.status === "pending").length,
        newNotices: unreadNoticesCount,
      });

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [getHeaders, user?._id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions — Bill Payment
  const handlePayBill = async (billId) => {
    if (!window.confirm("Do you want to pay this bill?")) return;
    try {
      const response = await fetch(`/api/maintenance/bills/${billId}/pay`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ method: "card", transactionId: `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`, gateway: "Razorpay" }),
      });
      if (!response.ok) throw new Error("Payment failed");
      await fetchData();
      alert("Payment successful!");
    } catch (error) {
      console.error("Error paying bill:", error);
      alert("Payment processing failed. Please try again.");
    }
  };

  // Actions — Submit Complaint
  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    setComplaintErrors({});
    if (!complaintForm.title.trim()) return setComplaintErrors({ title: "Title is required" });
    if (!complaintForm.description.trim()) return setComplaintErrors({ description: "Description is required" });

    setComplaintSubmitting(true);
    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(complaintForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to file complaint");

      setComplaintForm({ title: "", description: "", category: "infrastructure", priority: "medium" });
      await fetchData();
      alert("Complaint filed successfully!");
    } catch (error) {
      console.error("Error filing complaint:", error);
      setComplaintErrors({ submit: error.message });
    } finally {
      setComplaintSubmitting(false);
    }
  };

  // Actions — Pre-Approve Visitor
  const handleVisitorSubmit = async (e) => {
    e.preventDefault();
    setVisitorErrors({});
    if (!visitorForm.name.trim()) return setVisitorErrors({ name: "Visitor name is required" });
    if (!visitorForm.phone.trim()) return setVisitorErrors({ phone: "Contact number is required" });
    if (!visitorForm.expectedDate) return setVisitorErrors({ expectedDate: "Expected date is required" });

    setVisitorSubmitting(true);
    try {
      const response = await fetch("/api/visitors", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(visitorForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to pre-approve visitor");

      setVisitorForm({ name: "", phone: "", purpose: "Personal", expectedDate: "" });
      await fetchData();
      alert("Visitor pre-approved! QR code generated.");
    } catch (error) {
      console.error("Error pre-approving visitor:", error);
      setVisitorErrors({ submit: error.message });
    } finally {
      setVisitorSubmitting(false);
    }
  };

  // Actions — Notes CRUD Operations (Bug 4 & Bug 5)
  const handleNoteSave = async (e) => {
    e.preventDefault();
    setNoteErrors({});
    if (!noteForm.title.trim()) return setNoteErrors({ title: "Note title is required" });
    if (!noteForm.content.trim()) return setNoteErrors({ content: "Note content is required" });

    setNoteSubmitting(true);
    try {
      const payload = { title: noteForm.title, content: noteForm.content };
      let response;
      if (noteEditMode && noteForm.id) {
        // Enforce PATCH/PUT exact document update (No duplicates - Bug 5)
        response = await fetch(`/api/notes/${noteForm.id}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("/api/notes", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save note");

      setNoteForm({ id: "", title: "", content: "" });
      setNoteEditMode(false);
      await fetchData();
    } catch (error) {
      console.error("Error saving note:", error);
      setNoteErrors({ submit: error.message });
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleNoteEditInit = (note) => {
    setNoteForm({ id: note._id || note.id, title: note.title, content: note.content });
    setNoteEditMode(true);
  };

  const handleNoteDelete = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error("Delete failed");
      await fetchData();
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Failed to delete note. Try again.");
    }
  };

  const handleMarkNoticeAsRead = async (noticeId) => {
    try {
      await fetch(`/api/notices/${noticeId}/read`, {
        method: "PATCH",
        headers: getHeaders(),
      });
      fetchData();
    } catch (error) {
      console.error("Error marking notice as read:", error);
    }
  };

  return (
    <div style={{ padding: "32px", minHeight: "100vh", background: COLORS.bg, color: COLORS.text }}>
      <div style={{ marginBottom: "32px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
        <div>
          <h1 style={{ fontFamily: FONTS.serif, fontSize: "32px", fontWeight: 700, color: COLORS.text, marginBottom: "8px" }}>
            Welcome back, {user?.name || "Resident"}
          </h1>
          <p style={{ fontSize: "14px", color: COLORS.muted }}>
            Flat {user?.flatNumber || "—"} • Wing {user?.wing || "—"} • Resident Dashboard
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {user?.society && (
        <Card style={{ padding: "20px", marginBottom: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "20px", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "11px", color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>
                Current Society
              </div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: COLORS.text }}>
                {user.society?.name || user.society}
              </div>
              <div style={{ fontSize: "13px", color: COLORS.muted, marginTop: "6px" }}>
                {user.society?.address?.line1 || ""}, {user.society?.address?.city || ""}, {user.society?.address?.state || ""}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>
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
          { icon: "💳", label: "Due Amount", value: loading ? "..." : `₹${stats.dueAmount.toLocaleString()}` },
          { icon: "📋", label: "Open Complaints", value: loading ? "..." : stats.openComplaints.toString() },
          { icon: "🛡️", label: "Visitor Pre-approvals", value: loading ? "..." : visitors.length.toString() },
          { icon: "📢", label: "New Notices", value: loading ? "..." : stats.newNotices.toString() },
        ].map((stat) => (
          <Card key={stat.label} style={{ padding: "20px" }}>
            <div style={{ fontSize: "24px", marginBottom: "12px" }}>{stat.icon}</div>
            <div style={{ fontSize: "12px", color: COLORS.muted, marginBottom: "6px" }}>{stat.label}</div>
            <div style={{ fontSize: "20px", fontWeight: 600, color: COLORS.jade }}>{stat.value}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: "16px" }}>
        {["overview", "complaints", "visitors", "payments", "notes"].map((tab) => (
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
            {tab === "notes" ? "📝 Personal Notes" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.muted }}>
          Loading dashboard content...
        </div>
      )}

      {!loading && (
        <>
          {/* Tab 1: Overview */}
          {activeTab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <Card>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
                  Maintenance Bills Due
                </h3>
                {bills.filter(b => b.status === "pending" || b.status === "Unpaid").length === 0 ? (
                  <div style={{ color: COLORS.muted, fontSize: "13px" }}>No outstanding bills! Great job.</div>
                ) : (
                  bills.filter(b => b.status === "pending" || b.status === "Unpaid").map(bill => (
                    <div key={bill._id || bill.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: COLORS.bg, borderRadius: "8px", marginBottom: "8px" }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600 }}>{bill.type || "Maintenance"} Bill</div>
                        <div style={{ fontSize: "11px", color: COLORS.muted }}>Due: {bill.dueDate}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: COLORS.danger, marginBottom: "4px" }}>₹{bill.amount.toLocaleString()}</div>
                        <Button variant="primary" size="sm" onClick={() => handlePayBill(bill._id || bill.id)}>Pay Now</Button>
                      </div>
                    </div>
                  ))
                )}
              </Card>

              <Card>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
                  Recent Notices
                </h3>
                {notices.length === 0 ? (
                  <div style={{ color: COLORS.muted, fontSize: "13px" }}>No active notices published yet.</div>
                ) : (
                  notices.slice(0, 4).map((notice) => (
                    <div
                      key={notice._id || notice.id}
                      onClick={() => handleMarkNoticeAsRead(notice._id || notice.id)}
                      style={{
                        padding: "12px",
                        background: COLORS.bg,
                        borderRadius: "8px",
                        marginBottom: "8px",
                        fontSize: "13px",
                        color: COLORS.text,
                        cursor: "pointer",
                        borderLeft: `3px solid ${notice.priority === "urgent" || notice.priority === "important" ? COLORS.danger : COLORS.jade}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontWeight: 600 }}>{notice.title}</span>
                        {!notice.readBy?.includes(user?._id) && (
                          <Badge color="gold">New</Badge>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: "12px", color: COLORS.muted, lineHeight: 1.5 }}>{notice.message || notice.body}</p>
                      <div style={{ fontSize: "10px", color: COLORS.muted, marginTop: "6px", textAlign: "right" }}>
                        Published: {notice.publishDate}
                      </div>
                    </div>
                  ))
                )}
              </Card>
            </div>
          )}

          {/* Tab 2: Complaints */}
          {activeTab === "complaints" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <Card>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
                  File a Complaint
                </h3>
                <form onSubmit={handleComplaintSubmit}>
                  <Input
                    label="Complaint Title"
                    placeholder="Brief description of the problem"
                    value={complaintForm.title}
                    onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
                    error={complaintErrors.title}
                  />
                  
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "12px", color: COLORS.muted, marginBottom: "6px", fontWeight: 500 }}>Category</label>
                    <select
                      value={complaintForm.category}
                      onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.border}`, outline: "none", fontFamily: FONTS.sans }}
                    >
                      <option value="infrastructure">Infrastructure / Repairs</option>
                      <option value="security">Security</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="electrical">Electrical</option>
                      <option value="parking">Parking</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "12px", color: COLORS.muted, marginBottom: "6px", fontWeight: 500 }}>Priority</label>
                    <select
                      value={complaintForm.priority}
                      onChange={(e) => setComplaintForm({ ...complaintForm, priority: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.border}`, outline: "none", fontFamily: FONTS.sans }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "12px", color: COLORS.muted, marginBottom: "6px", fontWeight: 500 }}>Detailed Description</label>
                    <textarea
                      placeholder="Explain the issue in detail..."
                      rows="4"
                      value={complaintForm.description}
                      onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.border}`, outline: "none", fontFamily: FONTS.sans, resize: "none" }}
                    />
                    {complaintErrors.description && (
                      <div style={{ color: COLORS.danger, fontSize: "11px", marginTop: "4px" }}>{complaintErrors.description}</div>
                    )}
                  </div>

                  <Button variant="primary" style={{ width: "100%" }} disabled={complaintSubmitting}>
                    {complaintSubmitting ? "Filing..." : "Submit Complaint"}
                  </Button>

                  {complaintErrors.submit && (
                    <div style={{ color: COLORS.danger, fontSize: "12px", textAlign: "center", marginTop: "10px" }}>{complaintErrors.submit}</div>
                  )}
                </form>
              </Card>

              <Card>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
                  Your Filed Complaints
                </h3>
                {complaints.length === 0 ? (
                  <div style={{ color: COLORS.muted, fontSize: "13px" }}>You have not filed any complaints yet.</div>
                ) : (
                  complaints.map((complaint) => (
                    <div key={complaint._id || complaint.id} style={{ padding: "12px", background: COLORS.bg, borderRadius: "8px", marginBottom: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                        <div style={{ fontWeight: 600, fontSize: "13px" }}>{complaint.title}</div>
                        <Badge color={complaint.status === "resolved" ? "jade" : complaint.status === "in_progress" ? "gold" : "ghost"}>
                          {complaint.status === "submitted" ? "Open" : complaint.status}
                        </Badge>
                      </div>
                      <div style={{ fontSize: "12px", color: COLORS.muted, lineHeight: 1.5, marginBottom: "6px" }}>
                        {complaint.description}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: COLORS.muted }}>
                        <span>Category: {complaint.category} • Priority: {complaint.priority}</span>
                        <span>Date: {complaint.createdAt ? complaint.createdAt.slice(0, 10) : ""}</span>
                      </div>
                    </div>
                  ))
                )}
              </Card>
            </div>
          )}

          {/* Tab 3: Visitors */}
          {activeTab === "visitors" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <Card>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
                  Pre-Approve Visitor
                </h3>
                <form onSubmit={handleVisitorSubmit}>
                  <Input
                    label="Visitor Full Name"
                    placeholder="E.g. Rajesh Sharma"
                    value={visitorForm.name}
                    onChange={(e) => setVisitorForm({ ...visitorForm, name: e.target.value })}
                    error={visitorErrors.name}
                  />

                  <Input
                    label="Visitor Contact Number"
                    placeholder="10 digit number"
                    value={visitorForm.phone}
                    onChange={(e) => setVisitorForm({ ...visitorForm, phone: e.target.value })}
                    error={visitorErrors.phone}
                  />

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "12px", color: COLORS.muted, marginBottom: "6px", fontWeight: 500 }}>Expected Date</label>
                    <input
                      type="date"
                      value={visitorForm.expectedDate}
                      onChange={(e) => setVisitorForm({ ...visitorForm, expectedDate: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.border}`, outline: "none", fontFamily: FONTS.sans }}
                    />
                    {visitorErrors.expectedDate && (
                      <div style={{ color: COLORS.danger, fontSize: "11px", marginTop: "4px" }}>{visitorErrors.expectedDate}</div>
                    )}
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "12px", color: COLORS.muted, marginBottom: "6px", fontWeight: 500 }}>Purpose of Visit</label>
                    <select
                      value={visitorForm.purpose}
                      onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.border}`, outline: "none", fontFamily: FONTS.sans }}
                    >
                      <option value="Personal">Personal / Family</option>
                      <option value="Delivery">Delivery / Courier</option>
                      <option value="Maintenance">Maintenance / Service</option>
                      <option value="Cab">Cab / Transport</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <Button variant="primary" style={{ width: "100%" }} disabled={visitorSubmitting}>
                    {visitorSubmitting ? "Approving..." : "Generate Pre-Approval QR"}
                  </Button>

                  {visitorErrors.submit && (
                    <div style={{ color: COLORS.danger, fontSize: "12px", textAlign: "center", marginTop: "10px" }}>{visitorErrors.submit}</div>
                  )}
                </form>
              </Card>

              <Card>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
                  Active Pre-Approvals & Entry Logs
                </h3>
                {visitors.length === 0 ? (
                  <div style={{ color: COLORS.muted, fontSize: "13px" }}>No active visitor passes.</div>
                ) : (
                  visitors.map((visitor) => (
                    <div key={visitor._id || visitor.id} style={{ display: "flex", gap: "14px", padding: "12px", background: COLORS.bg, borderRadius: "8px", marginBottom: "8px", alignItems: "center" }}>
                      {visitor.qrImage ? (
                        <img src={visitor.qrImage} alt="QR Code" style={{ width: "80px", height: "80px", borderRadius: "4px", background: "#fff", padding: "2px" }} />
                      ) : (
                        <div style={{ width: "80px", height: "80px", borderRadius: "4px", background: COLORS.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>📲</div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 600, fontSize: "13px" }}>{visitor.name}</span>
                          <Badge color={visitor.status === "approved" ? "jade" : visitor.status === "pending" ? "gold" : "ghost"}>
                            {visitor.status === "approved" ? "Approved" : visitor.status}
                          </Badge>
                        </div>
                        <div style={{ fontSize: "11px", color: COLORS.muted, marginTop: "4px" }}>
                          Expected: {visitor.expectedDate ? visitor.expectedDate.slice(0, 10) : "Today"} • Phone: {visitor.phone}
                        </div>
                        <div style={{ fontSize: "11px", color: COLORS.muted, marginTop: "2px" }}>
                          Purpose: {visitor.purpose}
                        </div>
                        {visitor.entryTime && (
                          <div style={{ fontSize: "11px", color: COLORS.jade, fontWeight: 500, marginTop: "4px" }}>
                            Entered Gate: {new Date(visitor.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                        {visitor.exitTime && (
                          <div style={{ fontSize: "11px", color: COLORS.muted, marginTop: "2px" }}>
                            Exited: {new Date(visitor.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </Card>
            </div>
          )}

          {/* Tab 4: Payments */}
          {activeTab === "payments" && (
            <Card>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
                Maintenance Billing & Payment History
              </h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: COLORS.muted, fontSize: "12px", borderBottom: `1px solid ${COLORS.border}` }}>
                      <th style={{ padding: "12px" }}>Bill Month</th>
                      <th style={{ padding: "12px" }}>Type</th>
                      <th style={{ padding: "12px" }}>Due Date</th>
                      <th style={{ padding: "12px" }}>Amount</th>
                      <th style={{ padding: "12px" }}>Status</th>
                      <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: "20px", textAlign: "center", color: COLORS.muted, fontSize: "13px" }}>
                          No bills generated for your account.
                        </td>
                      </tr>
                    ) : (
                      bills.map((bill) => (
                        <tr key={bill._id || bill.id} style={{ borderBottom: `1px solid ${COLORS.border}`, fontSize: "13px" }}>
                          <td style={{ padding: "12px" }}>{bill.billingMonth || "—"}</td>
                          <td style={{ padding: "12px" }}>{bill.type || "Maintenance"}</td>
                          <td style={{ padding: "12px" }}>{bill.dueDate}</td>
                          <td style={{ padding: "12px", fontWeight: 600 }}>₹{bill.amount.toLocaleString()}</td>
                          <td style={{ padding: "12px" }}>
                            <Badge color={bill.status === "paid" || bill.status === "Paid" ? "jade" : "gold"}>
                              {bill.status === "pending" ? "Unpaid" : bill.status}
                            </Badge>
                          </td>
                          <td style={{ padding: "12px", textAlign: "right" }}>
                            {(bill.status === "pending" || bill.status === "Unpaid") ? (
                              <Button variant="primary" size="sm" onClick={() => handlePayBill(bill._id || bill.id)}>
                                Pay Invoice
                              </Button>
                            ) : (
                              <span style={{ color: COLORS.jade, fontSize: "12px", fontWeight: 500 }}>✓ Transaction Complete</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Tab 5: Personal Notes (CRUD Flow - Bug 4 & 5) */}
          {activeTab === "notes" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px" }}>
              <Card>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
                  {noteEditMode ? "📝 Edit Personal Note" : "📝 Create a Personal Note"}
                </h3>
                <form onSubmit={handleNoteSave}>
                  <Input
                    label="Note Title"
                    placeholder="Give your note a title..."
                    value={noteForm.title}
                    onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                    error={noteErrors.title}
                  />

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "12px", color: COLORS.muted, marginBottom: "6px", fontWeight: 500 }}>Content</label>
                    <textarea
                      placeholder="Write your note details here..."
                      rows="6"
                      value={noteForm.content}
                      onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.border}`, outline: "none", fontFamily: FONTS.sans, resize: "none" }}
                    />
                    {noteErrors.content && (
                      <div style={{ color: COLORS.danger, fontSize: "11px", marginTop: "4px" }}>{noteErrors.content}</div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button variant="primary" style={{ flex: 1 }} disabled={noteSubmitting}>
                      {noteSubmitting ? "Saving..." : noteEditMode ? "Update Note" : "Save Note"}
                    </Button>
                    {noteEditMode && (
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => {
                          setNoteForm({ id: "", title: "", content: "" });
                          setNoteEditMode(false);
                          setNoteErrors({});
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>

                  {noteErrors.submit && (
                    <div style={{ color: COLORS.danger, fontSize: "12px", textAlign: "center", marginTop: "10px" }}>{noteErrors.submit}</div>
                  )}
                </form>
              </Card>

              <Card>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: COLORS.text, marginBottom: "16px" }}>
                  Your Saved Notes
                </h3>
                {notes.length === 0 ? (
                  <div style={{ color: COLORS.muted, fontSize: "13px" }}>No personal notes saved yet. Keep track of unit details or society matters here!</div>
                ) : (
                  notes.map((note) => (
                    <div key={note._id || note.id} style={{ padding: "14px", background: COLORS.bg, borderRadius: "8px", marginBottom: "10px", borderLeft: `3px solid ${COLORS.jade}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                        <span style={{ fontWeight: 600, fontSize: "14px" }}>{note.title}</span>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => handleNoteEditInit(note)}
                            style={{ background: "none", border: "none", color: COLORS.jade, cursor: "pointer", fontSize: "12px", fontWeight: 500 }}
                          >
                            Edit
                          </button>
                          <span style={{ color: COLORS.muted }}>|</span>
                          <button
                            onClick={() => handleNoteDelete(note._id || note.id)}
                            style={{ background: "none", border: "none", color: COLORS.danger, cursor: "pointer", fontSize: "12px", fontWeight: 500 }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: "12px", color: COLORS.muted, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                        {note.content}
                      </p>
                      <div style={{ fontSize: "9px", color: COLORS.muted, marginTop: "8px", textAlign: "right" }}>
                        Saved: {note.createdAt ? new Date(note.createdAt).toLocaleString() : ""}
                      </div>
                    </div>
                  ))
                )}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ResidentDashboard;
