import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { COLORS, FONTS } from "../theme";
import { Card, Button, Badge, Input } from "../components/Common";

const STORAGE_KEY = "superAdminDashboardData";

const defaultData = {
  societies: [
    {
      id: "soc-1",
      name: "Green Meadows Society",
      city: "Bangalore",
      address: { line1: "45 Lakeview Road", city: "Bangalore", state: "Karnataka", pincode: "560001" },
      totalUnits: 120,
      adminName: "Ananya Sharma",
      status: "Active",
      registeredAt: "2025-10-02",
      plan: "Premium",
      billingStatus: "Current",
      activity: ["New resident added", "September bill posted", "Fire safety audit completed"],
    },
    {
      id: "soc-2",
      name: "Sunset Enclave",
      city: "Mumbai",
      address: { line1: "12 Palm Avenue", city: "Mumbai", state: "Maharashtra", pincode: "400010" },
      totalUnits: 80,
      adminName: "Rohit Mehra",
      status: "Active",
      registeredAt: "2026-01-18",
      plan: "Standard",
      billingStatus: "Due",
      activity: ["Water pump repaired", "New notice published", "Pending maintenance payment"],
    },
  ],
  residents: [
    {
      id: "res-1",
      name: "Nisha Patel",
      unitNumber: "A-101",
      societyId: "soc-1",
      contact: "+91 98765 43210",
      email: "nisha.patel@example.com",
      moveInDate: "2025-11-05",
      status: "Active",
    },
    {
      id: "res-2",
      name: "Amit Joshi",
      unitNumber: "B-204",
      societyId: "soc-1",
      contact: "+91 91234 56789",
      email: "amit.joshi@example.com",
      moveInDate: "2026-01-10",
      status: "Active",
    },
    {
      id: "res-3",
      name: "Priya Singh",
      unitNumber: "C-302",
      societyId: "soc-2",
      contact: "+91 99887 66554",
      email: "priya.singh@example.com",
      moveInDate: "2026-02-12",
      status: "Inactive",
    },
  ],
  bills: [
    {
      id: "bill-1",
      type: "Maintenance",
      amount: 4200,
      dueDate: "2026-05-25",
      societyId: "soc-1",
      residentId: "res-1",
      status: "Unpaid",
      createdAt: "2026-05-01",
    },
    {
      id: "bill-2",
      type: "Water",
      amount: 1200,
      dueDate: "2026-05-18",
      societyId: "soc-2",
      residentId: "res-3",
      status: "Paid",
      createdAt: "2026-05-03",
    },
  ],
  complaints: [
    {
      id: "cmp-1",
      title: "Elevator not working",
      description: "The main elevator has been stuck twice this week.",
      societyId: "soc-1",
      residentId: "res-1",
      category: "Infrastructure",
      priority: "High",
      status: "Open",
      createdAt: "2026-05-12",
    },
    {
      id: "cmp-2",
      title: "Street lights off",
      description: "The street lights in block B are not turning on after 8pm.",
      societyId: "soc-2",
      residentId: "res-3",
      category: "Safety",
      priority: "Medium",
      status: "In Progress",
      createdAt: "2026-05-14",
    },
  ],
  notices: [
    {
      id: "notice-1",
      title: "Annual Fire Drill",
      message: "All residents are requested to attend the fire drill on 15th May.",
      target: "All",
      type: "Urgent",
      publishDate: "2026-05-10",
      expiryDate: "2026-05-16",
    },
    {
      id: "notice-2",
      title: "Gardening Day",
      message: "Volunteers needed for society gardening on Saturday.",
      target: "soc-1",
      type: "General",
      publishDate: "2026-05-11",
      expiryDate: "2026-05-20",
    },
  ],
};

const dateNow = () => new Date().toISOString().slice(0, 10);
const formatCurrency = (value) => `₹${Number(value).toLocaleString()}`;
const generateId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const loadDashboardData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw);
    return {
      societies: parsed.societies || defaultData.societies,
      residents: parsed.residents || defaultData.residents,
      bills: parsed.bills || defaultData.bills,
      complaints: parsed.complaints || defaultData.complaints,
      notices: parsed.notices || defaultData.notices,
    };
  } catch (error) {
    console.error("Failed to load dashboard data", error);
    return defaultData;
  }
};

const saveDashboardData = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const statusBadge = (value) => {
  if (value === "Active" || value === "Paid" || value === "Resolved") return "jade";
  if (value === "Due" || value === "Unpaid" || value === "Open") return "gold";
  return "ghost";
};

const AdminDashboard = ({ user }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");

  const [societies, setSocieties] = useState([]);
  const [residents, setResidents] = useState([]);
  const [bills, setBills] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [notices, setNotices] = useState([]);

  const [showSocietyModal, setShowSocietyModal] = useState(false);
  const [societyForm, setSocietyForm] = useState({ id: "", name: "", line1: "", city: "", state: "", pincode: "", totalUnits: "", adminName: "", status: "Active", plan: "Premium", billingStatus: "Current" });
  const [societyErrors, setSocietyErrors] = useState({});
  const [societyModalMode, setSocietyModalMode] = useState("create");
  const [detailSociety, setDetailSociety] = useState(null);

  const [residentModalOpen, setResidentModalOpen] = useState(false);
  const [residentForm, setResidentForm] = useState({ id: "", name: "", unitNumber: "", societyId: "", contact: "", email: "", moveInDate: dateNow(), status: "Active" });
  const [residentErrors, setResidentErrors] = useState({});
  const [residentFilter, setResidentFilter] = useState("all");

  const [billModalOpen, setBillModalOpen] = useState(false);
  const [billForm, setBillForm] = useState({ id: "", type: "Maintenance", amount: "", dueDate: dateNow(), societyId: "", residentId: "", status: "Unpaid" });
  const [billErrors, setBillErrors] = useState({});
  const [billFilter, setBillFilter] = useState("all");

  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [complaintForm, setComplaintForm] = useState({ id: "", title: "", description: "", societyId: "", residentId: "", category: "Infrastructure", priority: "Medium", status: "Open" });
  const [complaintErrors, setComplaintErrors] = useState({});
  const [complaintFilter, setComplaintFilter] = useState("all");

  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ id: "", title: "", message: "", target: "All", type: "General", publishDate: dateNow(), expiryDate: dateNow() });
  const [noticeErrors, setNoticeErrors] = useState({});
  const [noticeFilter, setNoticeFilter] = useState("all");

  useEffect(() => {
    const data = loadDashboardData();
    setSocieties(data.societies);
    setResidents(data.residents);
    setBills(data.bills);
    setComplaints(data.complaints);
    setNotices(data.notices);
  }, []);

  useEffect(() => {
    saveDashboardData({ societies, residents, bills, complaints, notices });
  }, [societies, residents, bills, complaints, notices]);

  const counts = useMemo(() => {
    const totalSocieties = societies.length;
    const totalResidents = residents.length;
    const pendingComplaints = complaints.filter((item) => item.status !== "Resolved").length;
    const now = new Date();
    const activeNotices = notices.filter((item) => {
      const publish = new Date(item.publishDate);
      const expire = new Date(item.expiryDate);
      return publish <= now && now <= expire;
    }).length;
    const pendingBills = bills.filter((item) => item.status !== "Paid").length;
    const collectedRevenue = bills.filter((item) => item.status === "Paid").reduce((sum, bill) => sum + Number(bill.amount || 0), 0);

    return { totalSocieties, totalResidents, pendingComplaints, activeNotices, pendingBills, collectedRevenue };
  }, [societies, residents, bills, complaints, notices]);

  const societyOptions = societies.map((society) => ({ value: society.id, label: society.name }));

  const visibleResidents = residents.filter((resident) => residentFilter === "all" || resident.societyId === residentFilter);
  const visibleBills = bills.filter((bill) => billFilter === "all" || bill.societyId === billFilter);
  const visibleComplaints = complaints.filter((complaint) => complaintFilter === "all" || complaint.societyId === complaintFilter);
  const visibleNotices = notices.filter((notice) => noticeFilter === "all" || notice.target === "All" || notice.target === noticeFilter);

  const handleLogout = () => {
    logout();
    navigate("/auth?mode=login");
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  const openSocietyModal = (mode = "create", society = null) => {
    setSocietyModalMode(mode);
    if (mode === "edit" && society) {
      setSocietyForm({
        id: society.id,
        name: society.name,
        line1: society.address.line1,
        city: society.address.city,
        state: society.address.state,
        pincode: society.address.pincode,
        totalUnits: society.totalUnits,
        adminName: society.adminName,
        status: society.status,
        plan: society.plan,
        billingStatus: society.billingStatus,
      });
    } else {
      setSocietyForm({ id: "", name: "", line1: "", city: "", state: "", pincode: "", totalUnits: "", adminName: "", status: "Active", plan: "Premium", billingStatus: "Current" });
    }
    setSocietyErrors({});
    setShowSocietyModal(true);
  };

  const closeSocietyModal = () => setShowSocietyModal(false);

  const validateSociety = () => {
    const errors = {};
    if (!societyForm.name.trim()) errors.name = "Society name is required.";
    if (!societyForm.city.trim()) errors.city = "City is required.";
    if (!societyForm.state.trim()) errors.state = "State is required.";
    if (!societyForm.totalUnits || Number(societyForm.totalUnits) <= 0) errors.totalUnits = "Total units must be greater than zero.";
    if (!societyForm.adminName.trim()) errors.adminName = "Admin name is required.";
    return errors;
  };

  const handleSocietySave = (event) => {
    event.preventDefault();
    const errors = validateSociety();
    if (Object.keys(errors).length) {
      setSocietyErrors(errors);
      return;
    }

    const societyPayload = {
      id: societyModalMode === "edit" ? societyForm.id : generateId("soc"),
      name: societyForm.name,
      city: societyForm.city,
      address: { line1: societyForm.line1, city: societyForm.city, state: societyForm.state, pincode: societyForm.pincode },
      totalUnits: Number(societyForm.totalUnits),
      adminName: societyForm.adminName,
      status: societyForm.status,
      registeredAt: societyModalMode === "edit" ? societies.find((s) => s.id === societyForm.id).registeredAt : dateNow(),
      plan: societyForm.plan,
      billingStatus: societyForm.billingStatus,
      activity: societyModalMode === "edit" ? societies.find((s) => s.id === societyForm.id).activity : ["Society created"],
    };

    if (societyModalMode === "edit") {
      setSocieties((prev) => prev.map((item) => (item.id === societyPayload.id ? societyPayload : item)));
    } else {
      setSocieties((prev) => [societyPayload, ...prev]);
    }

    closeSocietyModal();
  };

  const confirmDeleteSociety = (id) => {
    if (!window.confirm("Delete this society and all linked data?")) return;
    setSocieties((prev) => prev.filter((item) => item.id !== id));
    setResidents((prev) => prev.filter((resident) => resident.societyId !== id));
    setBills((prev) => prev.filter((bill) => bill.societyId !== id));
    setComplaints((prev) => prev.filter((complaint) => complaint.societyId !== id));
    setNotices((prev) => prev.filter((notice) => notice.target !== id));
    if (detailSociety?.id === id) setDetailSociety(null);
  };

  const openDetailSociety = (society) => setDetailSociety(society);
  const closeDetailSociety = () => setDetailSociety(null);

  const openResidentModal = (resident = null) => {
    if (resident) {
      setResidentForm({ ...resident });
    } else {
      setResidentForm({ id: "", name: "", unitNumber: "", societyId: societies[0]?.id || "", contact: "", email: "", moveInDate: dateNow(), status: "Active" });
    }
    setResidentErrors({});
    setResidentModalOpen(true);
  };

  const closeResidentModal = () => setResidentModalOpen(false);

  const validateResident = () => {
    const errors = {};
    if (!residentForm.name.trim()) errors.name = "Name is required.";
    if (!residentForm.unitNumber.trim()) errors.unitNumber = "Unit number is required.";
    if (!residentForm.societyId) errors.societyId = "Society is required.";
    if (!residentForm.contact.trim()) errors.contact = "Contact is required.";
    if (!residentForm.email.trim()) errors.email = "Email is required.";
    return errors;
  };

  const handleResidentSave = (event) => {
    event.preventDefault();
    const errors = validateResident();
    if (Object.keys(errors).length) {
      setResidentErrors(errors);
      return;
    }

    const payload = {
      ...residentForm,
      id: residentForm.id || generateId("res"),
    };

    if (residentForm.id) {
      setResidents((prev) => prev.map((item) => (item.id === payload.id ? payload : item)));
    } else {
      setResidents((prev) => [payload, ...prev]);
    }

    closeResidentModal();
  };

  const confirmDeleteResident = (id) => {
    if (!window.confirm("Delete this resident?")) return;
    setResidents((prev) => prev.filter((item) => item.id !== id));
    setBills((prev) => prev.map((bill) => (bill.residentId === id ? { ...bill, residentId: "" } : bill)));
    setComplaints((prev) => prev.map((cmp) => (cmp.residentId === id ? { ...cmp, residentId: "" } : cmp)));
  };

  const openBillModal = (bill = null) => {
    if (bill) {
      setBillForm({ ...bill });
    } else {
      setBillForm({ id: "", type: "Maintenance", amount: "", dueDate: dateNow(), societyId: societies[0]?.id || "", residentId: "", status: "Unpaid" });
    }
    setBillErrors({});
    setBillModalOpen(true);
  };

  const closeBillModal = () => setBillModalOpen(false);

  const validateBill = () => {
    const errors = {};
    if (!billForm.type.trim()) errors.type = "Bill type is required.";
    if (!billForm.amount || Number(billForm.amount) <= 0) errors.amount = "Amount must be greater than zero.";
    if (!billForm.societyId) errors.societyId = "Society is required.";
    if (!billForm.dueDate) errors.dueDate = "Due date is required.";
    return errors;
  };

  const handleBillSave = (event) => {
    event.preventDefault();
    const errors = validateBill();
    if (Object.keys(errors).length) {
      setBillErrors(errors);
      return;
    }

    const payload = {
      ...billForm,
      id: billForm.id || generateId("bill"),
      amount: Number(billForm.amount),
      createdAt: billForm.id ? bills.find((item) => item.id === billForm.id).createdAt : dateNow(),
    };

    if (billForm.id) {
      setBills((prev) => prev.map((item) => (item.id === payload.id ? payload : item)));
    } else {
      setBills((prev) => [payload, ...prev]);
    }

    closeBillModal();
  };

  const confirmDeleteBill = (id) => {
    if (!window.confirm("Delete this bill?")) return;
    setBills((prev) => prev.filter((item) => item.id !== id));
  };

  const openComplaintModal = (complaint = null) => {
    if (complaint) {
      setComplaintForm({ ...complaint });
    } else {
      setComplaintForm({ id: "", title: "", description: "", societyId: societies[0]?.id || "", residentId: "", category: "Infrastructure", priority: "Medium", status: "Open" });
    }
    setComplaintErrors({});
    setComplaintModalOpen(true);
  };

  const closeComplaintModal = () => setComplaintModalOpen(false);

  const validateComplaint = () => {
    const errors = {};
    if (!complaintForm.title.trim()) errors.title = "Title is required.";
    if (!complaintForm.description.trim()) errors.description = "Description is required.";
    if (!complaintForm.societyId) errors.societyId = "Society is required.";
    return errors;
  };

  const handleComplaintSave = (event) => {
    event.preventDefault();
    const errors = validateComplaint();
    if (Object.keys(errors).length) {
      setComplaintErrors(errors);
      return;
    }

    const payload = {
      ...complaintForm,
      id: complaintForm.id || generateId("cmp"),
      createdAt: complaintForm.id ? complaints.find((item) => item.id === complaintForm.id).createdAt : dateNow(),
    };

    if (complaintForm.id) {
      setComplaints((prev) => prev.map((item) => (item.id === payload.id ? payload : item)));
    } else {
      setComplaints((prev) => [payload, ...prev]);
    }

    closeComplaintModal();
  };

  const confirmDeleteComplaint = (id) => {
    if (!window.confirm("Delete this complaint?")) return;
    setComplaints((prev) => prev.filter((item) => item.id !== id));
  };

  const openNoticeModal = (notice = null) => {
    if (notice) {
      setNoticeForm({ ...notice });
    } else {
      setNoticeForm({ id: "", title: "", message: "", target: "All", type: "General", publishDate: dateNow(), expiryDate: dateNow() });
    }
    setNoticeErrors({});
    setNoticeModalOpen(true);
  };

  const closeNoticeModal = () => setNoticeModalOpen(false);

  const validateNotice = () => {
    const errors = {};
    if (!noticeForm.title.trim()) errors.title = "Title is required.";
    if (!noticeForm.message.trim()) errors.message = "Message is required.";
    if (!noticeForm.publishDate) errors.publishDate = "Publish date is required.";
    if (!noticeForm.expiryDate) errors.expiryDate = "Expiry date is required.";
    if (noticeForm.publishDate && noticeForm.expiryDate && noticeForm.publishDate > noticeForm.expiryDate) errors.expiryDate = "Expiry date must be after publish date.";
    return errors;
  };

  const handleNoticeSave = (event) => {
    event.preventDefault();
    const errors = validateNotice();
    if (Object.keys(errors).length) {
      setNoticeErrors(errors);
      return;
    }

    const payload = {
      ...noticeForm,
      id: noticeForm.id || generateId("notice"),
    };

    if (noticeForm.id) {
      setNotices((prev) => prev.map((item) => (item.id === payload.id ? payload : item)));
    } else {
      setNotices((prev) => [payload, ...prev]);
    }

    closeNoticeModal();
  };

  const confirmDeleteNotice = (id) => {
    if (!window.confirm("Delete this notice?")) return;
    setNotices((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.text, padding: "24px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "24px", maxWidth: "1640px", margin: "0 auto" }}>
        <aside style={{ position: "sticky", top: "24px", alignSelf: "start" }}>
          <Card style={{ padding: "24px" }}>
            <div style={{ marginBottom: "22px" }}>
              <div style={{ fontSize: "14px", color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: "10px" }}>
                Super Admin
              </div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: COLORS.text }}>
                {user?.name || "Super Admin"}
              </div>
              <div style={{ fontSize: "13px", color: COLORS.muted, marginTop: "8px" }}>
                Manage societies, residents, billing, complaints, and notices.
              </div>
            </div>
            {[
              { id: "dashboard", label: "Dashboard" },
              { id: "societies", label: "Societies" },
              { id: "residents", label: "Residents" },
              { id: "billing", label: "Billing" },
              { id: "complaints", label: "Complaints" },
              { id: "notices", label: "Notices" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSectionChange(item.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 14px",
                  marginBottom: "8px",
                  borderRadius: "10px",
                  border: "none",
                  background: activeSection === item.id ? COLORS.jadedim : COLORS.surface,
                  color: activeSection === item.id ? COLORS.jade : COLORS.text,
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                {item.label}
              </button>
            ))}
          </Card>
          <Card style={{ marginTop: "18px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: COLORS.text }}>Quick Actions</div>
            </div>
            <Button variant="primary" size="sm" style={{ width: "100%", marginBottom: "10px" }} onClick={() => openSocietyModal()}>Register New Society</Button>
            <Button variant="secondary" size="sm" style={{ width: "100%", marginBottom: "10px" }} onClick={() => openResidentModal()}>Add Resident</Button>
            <Button variant="secondary" size="sm" style={{ width: "100%", marginBottom: "10px" }} onClick={() => openBillModal()}>Create Bill</Button>
            <Button variant="secondary" size="sm" style={{ width: "100%", marginBottom: "10px" }} onClick={() => openComplaintModal()}>Log Complaint</Button>
            <Button variant="secondary" size="sm" style={{ width: "100%" }} onClick={() => openNoticeModal()}>Publish Notice</Button>
          </Card>
        </aside>

        <main>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
            <div>
              <h1 style={{ fontFamily: FONTS.serif, fontSize: "34px", margin: 0, fontWeight: 700, color: COLORS.text }}>
                Super Admin Dashboard
              </h1>
              <p style={{ color: COLORS.muted, marginTop: "10px", maxWidth: "680px" }}>
                Use the sections below to manage societies, residents, billing, complaints, and notices with in-session persistence.
              </p>
            </div>
            <Button variant="secondary" onClick={handleLogout}>Logout</Button>
          </div>

          {activeSection === "dashboard" && (
            <div style={{ display: "grid", gap: "20px", marginBottom: "28px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "16px" }}>
                {[
                  { label: "Total Societies", value: counts.totalSocieties, icon: "🏘️" },
                  { label: "Total Residents", value: counts.totalResidents, icon: "👥" },
                  { label: "Pending Complaints", value: counts.pendingComplaints, icon: "⚠️" },
                  { label: "Active Notices", value: counts.activeNotices, icon: "📢" },
                  { label: "Pending Bills", value: counts.pendingBills, icon: "🧾" },
                  { label: "Collected Revenue", value: formatCurrency(counts.collectedRevenue), icon: "💰" },
                ].map((item) => (
                  <Card key={item.label} style={{ padding: "22px", minHeight: "130px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                      <span style={{ fontSize: "22px" }}>{item.icon}</span>
                      <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.12em", color: COLORS.muted }}>
                        {item.label}
                      </span>
                    </div>
                    <div style={{ fontSize: "32px", fontWeight: 700, color: COLORS.jade }}>{item.value}</div>
                  </Card>
                ))}
              </div>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <h2 style={{ fontSize: "20px", margin: 0, color: COLORS.text }}>Society Snapshot</h2>
                    <p style={{ color: COLORS.muted, marginTop: "8px" }}>Quick status and higher-level trends across the platform.</p>
                  </div>
                  <Button variant="ghost" onClick={() => openSocietyModal()}>Register Society</Button>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "720px" }}>
                    <thead>
                      <tr style={{ textAlign: "left", color: COLORS.muted, fontSize: "12px", borderBottom: `1px solid ${COLORS.border}` }}>
                        {["Society name", "City", "Units", "Admin", "Status", "Registered", "Plan", "Billing"].map((heading) => (
                          <th key={heading} style={{ padding: "14px 12px" }}>{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {societies.map((society) => (
                        <tr key={society.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                          <td style={{ padding: "14px 12px" }}>
                            <button type="button" style={{ background: "none", border: "none", color: COLORS.jade, cursor: "pointer", fontWeight: 600 }} onClick={() => openDetailSociety(society)}>{society.name}</button>
                          </td>
                          <td style={{ padding: "14px 12px" }}>{society.city}</td>
                          <td style={{ padding: "14px 12px" }}>{society.totalUnits}</td>
                          <td style={{ padding: "14px 12px" }}>{society.adminName}</td>
                          <td style={{ padding: "14px 12px" }}><Badge color={statusBadge(society.status)}>{society.status}</Badge></td>
                          <td style={{ padding: "14px 12px" }}>{society.registeredAt}</td>
                          <td style={{ padding: "14px 12px" }}>{society.plan}</td>
                          <td style={{ padding: "14px 12px" }}>{society.billingStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeSection === "societies" && (
            <div style={{ display: "grid", gap: "20px" }}>
              <SectionHeader title="Society Management" description="Create, update, delete and inspect registered societies." actionLabel="Register New Society" onAction={() => openSocietyModal()} />
              <Card>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "860px" }}>
                    <thead>
                      <tr style={{ textAlign: "left", color: COLORS.muted, fontSize: "12px", borderBottom: `1px solid ${COLORS.border}` }}>
                        {["Society name", "City", "Units", "Admin", "Status", "Registered", "Actions"].map((heading) => (
                          <th key={heading} style={{ padding: "14px 12px" }}>{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {societies.map((society) => (
                        <tr key={society.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                          <td style={{ padding: "14px 12px" }}>
                            <button type="button" style={{ background: "none", border: "none", color: COLORS.jade, cursor: "pointer", fontWeight: 600 }} onClick={() => openDetailSociety(society)}>{society.name}</button>
                          </td>
                          <td style={{ padding: "14px 12px" }}>{society.city}</td>
                          <td style={{ padding: "14px 12px" }}>{society.totalUnits}</td>
                          <td style={{ padding: "14px 12px" }}>{society.adminName}</td>
                          <td style={{ padding: "14px 12px" }}><Badge color={statusBadge(society.status)}>{society.status}</Badge></td>
                          <td style={{ padding: "14px 12px" }}>{society.registeredAt}</td>
                          <td style={{ padding: "14px 12px", display: "flex", gap: "8px" }}>
                            <Button variant="secondary" size="sm" style={{ padding: "8px 14px" }} onClick={() => openSocietyModal("edit", society)}>Edit</Button>
                            <Button variant="ghost" size="sm" style={{ padding: "8px 14px", color: COLORS.danger }} onClick={() => confirmDeleteSociety(society.id)}>Delete</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeSection === "residents" && (
            <div style={{ display: "grid", gap: "20px" }}>
              <SectionHeader title="Residents Management" description="Manage residents by society and update their status." actionLabel="Add Resident" onAction={() => openResidentModal()} />
              <Card>
                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "18px" }}>
                  <div style={{ flex: "1 1 260px" }}>
                    <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Filter by Society</label>
                    <select value={residentFilter} onChange={(event) => setResidentFilter(event.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}>
                      <option value="all">All Societies</option>
                      {societies.map((society) => (<option key={society.id} value={society.id}>{society.name}</option>))}
                    </select>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                    <thead>
                      <tr style={{ textAlign: "left", color: COLORS.muted, fontSize: "12px", borderBottom: `1px solid ${COLORS.border}` }}>
                        {["Name", "Unit", "Society", "Contact", "Email", "Move-in", "Status", "Actions"].map((heading) => (
                          <th key={heading} style={{ padding: "14px 12px" }}>{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleResidents.map((resident) => {
                        const society = societies.find((soc) => soc.id === resident.societyId);
                        return (
                          <tr key={resident.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                            <td style={{ padding: "14px 12px" }}>{resident.name}</td>
                            <td style={{ padding: "14px 12px" }}>{resident.unitNumber}</td>
                            <td style={{ padding: "14px 12px" }}>{society?.name || "Unknown"}</td>
                            <td style={{ padding: "14px 12px" }}>{resident.contact}</td>
                            <td style={{ padding: "14px 12px" }}>{resident.email}</td>
                            <td style={{ padding: "14px 12px" }}>{resident.moveInDate}</td>
                            <td style={{ padding: "14px 12px" }}><Badge color={statusBadge(resident.status)}>{resident.status}</Badge></td>
                            <td style={{ padding: "14px 12px", display: "flex", gap: "8px" }}>
                              <Button variant="secondary" size="sm" style={{ padding: "8px 14px" }} onClick={() => openResidentModal(resident)}>Edit</Button>
                              <Button variant="ghost" size="sm" style={{ padding: "8px 14px", color: COLORS.danger }} onClick={() => confirmDeleteResident(resident.id)}>Delete</Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeSection === "billing" && (
            <div style={{ display: "grid", gap: "20px" }}>
              <SectionHeader title="Billing Management" description="Create and manage society and resident bills." actionLabel="Create Bill" onAction={() => openBillModal()} />
              <Card>
                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "18px" }}>
                  <div style={{ flex: "1 1 260px" }}>
                    <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Filter by Society</label>
                    <select value={billFilter} onChange={(event) => setBillFilter(event.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}>
                      <option value="all">All Societies</option>
                      {societies.map((society) => (<option key={society.id} value={society.id}>{society.name}</option>))}
                    </select>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "920px" }}>
                    <thead>
                      <tr style={{ textAlign: "left", color: COLORS.muted, fontSize: "12px", borderBottom: `1px solid ${COLORS.border}` }}>
                        {["Type", "Amount", "Due Date", "Society", "Resident", "Status", "Actions"].map((heading) => (
                          <th key={heading} style={{ padding: "14px 12px" }}>{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleBills.map((bill) => {
                        const society = societies.find((soc) => soc.id === bill.societyId);
                        const resident = residents.find((res) => res.id === bill.residentId);
                        return (
                          <tr key={bill.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                            <td style={{ padding: "14px 12px" }}>{bill.type}</td>
                            <td style={{ padding: "14px 12px" }}>{formatCurrency(bill.amount)}</td>
                            <td style={{ padding: "14px 12px" }}>{bill.dueDate}</td>
                            <td style={{ padding: "14px 12px" }}>{society?.name || "Unknown"}</td>
                            <td style={{ padding: "14px 12px" }}>{resident ? `${resident.name} (${resident.unitNumber})` : "Bulk"}</td>
                            <td style={{ padding: "14px 12px" }}><Badge color={statusBadge(bill.status)}>{bill.status}</Badge></td>
                            <td style={{ padding: "14px 12px", display: "flex", gap: "8px" }}>
                              <Button variant="secondary" size="sm" style={{ padding: "8px 14px" }} onClick={() => openBillModal(bill)}>Edit</Button>
                              <Button variant="ghost" size="sm" style={{ padding: "8px 14px", color: COLORS.danger }} onClick={() => confirmDeleteBill(bill.id)}>Delete</Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeSection === "complaints" && (
            <div style={{ display: "grid", gap: "20px" }}>
              <SectionHeader title="Complaints Management" description="Track complaints, update statuses, and resolve issues." actionLabel="Log Complaint" onAction={() => openComplaintModal()} />
              <Card>
                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "18px" }}>
                  <div style={{ flex: "1 1 260px" }}>
                    <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Filter by Society</label>
                    <select value={complaintFilter} onChange={(event) => setComplaintFilter(event.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}>
                      <option value="all">All Societies</option>
                      {societies.map((society) => (<option key={society.id} value={society.id}>{society.name}</option>))}
                    </select>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "940px" }}>
                    <thead>
                      <tr style={{ textAlign: "left", color: COLORS.muted, fontSize: "12px", borderBottom: `1px solid ${COLORS.border}` }}>
                        {["Title", "Society", "Resident", "Category", "Priority", "Status", "Actions"].map((heading) => (
                          <th key={heading} style={{ padding: "14px 12px" }}>{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleComplaints.map((item) => {
                        const society = societies.find((soc) => soc.id === item.societyId);
                        const resident = residents.find((res) => res.id === item.residentId);
                        return (
                          <tr key={item.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                            <td style={{ padding: "14px 12px" }}>{item.title}</td>
                            <td style={{ padding: "14px 12px" }}>{society?.name || "Unknown"}</td>
                            <td style={{ padding: "14px 12px" }}>{resident ? resident.name : "N/A"}</td>
                            <td style={{ padding: "14px 12px" }}>{item.category}</td>
                            <td style={{ padding: "14px 12px" }}>{item.priority}</td>
                            <td style={{ padding: "14px 12px" }}><Badge color={statusBadge(item.status)}>{item.status}</Badge></td>
                            <td style={{ padding: "14px 12px", display: "flex", gap: "8px" }}>
                              <Button variant="secondary" size="sm" style={{ padding: "8px 14px" }} onClick={() => openComplaintModal(item)}>Edit</Button>
                              <Button variant="ghost" size="sm" style={{ padding: "8px 14px", color: COLORS.danger }} onClick={() => confirmDeleteComplaint(item.id)}>Delete</Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeSection === "notices" && (
            <div style={{ display: "grid", gap: "20px" }}>
              <SectionHeader title="Notices Management" description="Publish targeted or all-society announcements." actionLabel="Publish Notice" onAction={() => openNoticeModal()} />
              <Card>
                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "18px" }}>
                  <div style={{ flex: "1 1 260px" }}>
                    <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Filter by Target</label>
                    <select value={noticeFilter} onChange={(event) => setNoticeFilter(event.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}>
                      <option value="all">All Notices</option>
                      <option value="All">All Societies</option>
                      {societies.map((society) => (<option key={society.id} value={society.id}>{society.name}</option>))}
                    </select>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                    <thead>
                      <tr style={{ textAlign: "left", color: COLORS.muted, fontSize: "12px", borderBottom: `1px solid ${COLORS.border}` }}>
                        {["Title", "Target", "Type", "Publish", "Expiry", "Actions"].map((heading) => (
                          <th key={heading} style={{ padding: "14px 12px" }}>{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleNotices.map((notice) => {
                        const targetLabel = notice.target === "All" ? "All Societies" : societies.find((soc) => soc.id === notice.target)?.name || "Unknown";
                        return (
                          <tr key={notice.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                            <td style={{ padding: "14px 12px", fontWeight: 600 }}>{notice.title}</td>
                            <td style={{ padding: "14px 12px" }}>{targetLabel}</td>
                            <td style={{ padding: "14px 12px" }}>{notice.type}</td>
                            <td style={{ padding: "14px 12px" }}>{notice.publishDate}</td>
                            <td style={{ padding: "14px 12px" }}>{notice.expiryDate}</td>
                            <td style={{ padding: "14px 12px", display: "flex", gap: "8px" }}>
                              <Button variant="secondary" size="sm" style={{ padding: "8px 14px" }} onClick={() => openNoticeModal(notice)}>Edit</Button>
                              <Button variant="ghost" size="sm" style={{ padding: "8px 14px", color: COLORS.danger }} onClick={() => confirmDeleteNotice(notice.id)}>Delete</Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>

      {showSocietyModal && (
        <Modal title={societyModalMode === "edit" ? "Edit Society" : "Register New Society"} onClose={closeSocietyModal}>
          <form onSubmit={handleSocietySave}>
            <Input label="Society Name" value={societyForm.name} onChange={(e) => setSocietyForm((prev) => ({ ...prev, name: e.target.value }))} error={societyErrors.name} />
            <Input label="Address Line 1" value={societyForm.line1} onChange={(e) => setSocietyForm((prev) => ({ ...prev, line1: e.target.value }))} />
            <Input label="City" value={societyForm.city} onChange={(e) => setSocietyForm((prev) => ({ ...prev, city: e.target.value }))} error={societyErrors.city} />
            <Input label="State" value={societyForm.state} onChange={(e) => setSocietyForm((prev) => ({ ...prev, state: e.target.value }))} error={societyErrors.state} />
            <Input label="Pincode" value={societyForm.pincode} onChange={(e) => setSocietyForm((prev) => ({ ...prev, pincode: e.target.value }))} />
            <Input label="Total Units" type="number" value={societyForm.totalUnits} onChange={(e) => setSocietyForm((prev) => ({ ...prev, totalUnits: e.target.value }))} error={societyErrors.totalUnits} />
            <Input label="Admin Name" value={societyForm.adminName} onChange={(e) => setSocietyForm((prev) => ({ ...prev, adminName: e.target.value }))} error={societyErrors.adminName} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Status</label>
                <select value={societyForm.status} onChange={(e) => setSocietyForm((prev) => ({ ...prev, status: e.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}>
                  <option>Active</option>
                  <option>Paused</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Plan</label>
                <select value={societyForm.plan} onChange={(e) => setSocietyForm((prev) => ({ ...prev, plan: e.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}>
                  <option>Premium</option>
                  <option>Standard</option>
                  <option>Basic</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: "14px" }}>
              <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Billing Status</label>
              <select value={societyForm.billingStatus} onChange={(e) => setSocietyForm((prev) => ({ ...prev, billingStatus: e.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}>
                <option>Current</option>
                <option>Due</option>
                <option>Overdue</option>
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginTop: "22px" }}>
              <Button variant="secondary" type="button" onClick={closeSocietyModal}>Cancel</Button>
              <Button type="submit">Save Society</Button>
            </div>
          </form>
        </Modal>
      )}

      {detailSociety && (
        <Modal title="Society Details" onClose={closeDetailSociety}>
          <div style={{ display: "grid", gap: "18px" }}>
            <Card style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "12px", color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>Society</div>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: COLORS.text }}>{detailSociety.name}</div>
                  <div style={{ color: COLORS.muted, marginTop: "8px" }}>{detailSociety.address.line1}, {detailSociety.city}, {detailSociety.address.state}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Badge color={statusBadge(detailSociety.status)}>{detailSociety.status}</Badge>
                  <div style={{ marginTop: "10px", fontSize: "12px", color: COLORS.muted }}><strong>Registered:</strong> {detailSociety.registeredAt}</div>
                </div>
              </div>
            </Card>
            <Card style={{ padding: "18px 20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                <MiniStat label="Admin" value={detailSociety.adminName} />
                <MiniStat label="Total Units" value={detailSociety.totalUnits} />
                <MiniStat label="Plan" value={detailSociety.plan} />
                <MiniStat label="Billing" value={detailSociety.billingStatus} />
                <MiniStat label="Residents" value={residents.filter((res) => res.societyId === detailSociety.id).length} />
              </div>
            </Card>
            <Card style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", color: COLORS.text }}>Recent Activity</div>
              {detailSociety.activity.map((item, index) => (
                <div key={index} style={{ padding: "12px", background: COLORS.surface, borderRadius: "12px", marginBottom: "10px", color: COLORS.text }}>{item}</div>
              ))}
            </Card>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <Button variant="secondary" onClick={closeDetailSociety}>Close</Button>
              <Button onClick={() => { closeDetailSociety(); openSocietyModal("edit", detailSociety); }}>Edit Society</Button>
            </div>
          </div>
        </Modal>
      )}

      {residentModalOpen && (
        <Modal title={residentForm.id ? "Edit Resident" : "Add Resident"} onClose={closeResidentModal}>
          <form onSubmit={handleResidentSave}>
            <Input label="Name" value={residentForm.name} onChange={(event) => setResidentForm((prev) => ({ ...prev, name: event.target.value }))} error={residentErrors.name} />
            <Input label="Unit Number" value={residentForm.unitNumber} onChange={(event) => setResidentForm((prev) => ({ ...prev, unitNumber: event.target.value }))} error={residentErrors.unitNumber} />
            <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "1fr 1fr" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Society</label>
                <select value={residentForm.societyId} onChange={(event) => setResidentForm((prev) => ({ ...prev, societyId: event.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}>
                  {societyOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                </select>
                {residentErrors.societyId && <div style={{ color: COLORS.danger, fontSize: "12px", marginTop: "6px" }}>{residentErrors.societyId}</div>}
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Status</label>
                <select value={residentForm.status} onChange={(event) => setResidentForm((prev) => ({ ...prev, status: event.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>
            <Input label="Contact" value={residentForm.contact} onChange={(event) => setResidentForm((prev) => ({ ...prev, contact: event.target.value }))} error={residentErrors.contact} />
            <Input label="Email" type="email" value={residentForm.email} onChange={(event) => setResidentForm((prev) => ({ ...prev, email: event.target.value }))} error={residentErrors.email} />
            <Input label="Move-in Date" type="date" value={residentForm.moveInDate} onChange={(event) => setResidentForm((prev) => ({ ...prev, moveInDate: event.target.value }))} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "22px" }}>
              <Button variant="secondary" type="button" onClick={closeResidentModal}>Cancel</Button>
              <Button type="submit">Save Resident</Button>
            </div>
          </form>
        </Modal>
      )}

      {billModalOpen && (
        <Modal title={billForm.id ? "Edit Bill" : "Create Bill"} onClose={closeBillModal}>
          <form onSubmit={handleBillSave}>
            <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "1fr 1fr" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Bill Type</label>
                <select value={billForm.type} onChange={(event) => setBillForm((prev) => ({ ...prev, type: event.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}>
                  <option>Maintenance</option>
                  <option>Water</option>
                  <option>Electricity</option>
                  <option>Other</option>
                </select>
                {billErrors.type && <div style={{ color: COLORS.danger, fontSize: "12px", marginTop: "6px" }}>{billErrors.type}</div>}
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Amount</label>
                <input type="number" value={billForm.amount} onChange={(event) => setBillForm((prev) => ({ ...prev, amount: event.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }} />
                {billErrors.amount && <div style={{ color: COLORS.danger, fontSize: "12px", marginTop: "6px" }}>{billErrors.amount}</div>}
              </div>
            </div>
            <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "1fr 1fr" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Society</label>
                <select value={billForm.societyId} onChange={(event) => setBillForm((prev) => ({ ...prev, societyId: event.target.value, residentId: "" }))} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}>
                  <option value="">Select society</option>
                  {societyOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                </select>
                {billErrors.societyId && <div style={{ color: COLORS.danger, fontSize: "12px", marginTop: "6px" }}>{billErrors.societyId}</div>}
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Resident (optional)</label>
                <select value={billForm.residentId} onChange={(event) => setBillForm((prev) => ({ ...prev, residentId: event.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}>
                  <option value="">Bulk / Society</option>
                  {residents.filter((res) => res.societyId === billForm.societyId).map((resident) => (<option key={resident.id} value={resident.id}>{resident.name}</option>))}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "1fr 1fr", marginTop: "14px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Due Date</label>
                <input type="date" value={billForm.dueDate} onChange={(event) => setBillForm((prev) => ({ ...prev, dueDate: event.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }} />
                {billErrors.dueDate && <div style={{ color: COLORS.danger, fontSize: "12px", marginTop: "6px" }}>{billErrors.dueDate}</div>}
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Status</label>
                <select value={billForm.status} onChange={(event) => setBillForm((prev) => ({ ...prev, status: event.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}>
                  <option>Unpaid</option>
                  <option>Paid</option>
                  <option>Overdue</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "22px" }}>
              <Button variant="secondary" type="button" onClick={closeBillModal}>Cancel</Button>
              <Button type="submit">Save Bill</Button>
            </div>
          </form>
        </Modal>
      )}

      {complaintModalOpen && (
        <Modal title={complaintForm.id ? "Edit Complaint" : "Create Complaint"} onClose={closeComplaintModal}>
          <form onSubmit={handleComplaintSave}>
            <Input label="Title" value={complaintForm.title} onChange={(event) => setComplaintForm((prev) => ({ ...prev, title: event.target.value }))} error={complaintErrors.title} />
            <Input label="Description" value={complaintForm.description} onChange={(event) => setComplaintForm((prev) => ({ ...prev, description: event.target.value }))} error={complaintErrors.description} />
            <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "1fr 1fr" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Society</label>
                <select value={complaintForm.societyId} onChange={(event) => setComplaintForm((prev) => ({ ...prev, societyId: event.target.value, residentId: "" }))} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}>
                  <option value="">Select society</option>
                  {societyOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                </select>
                {complaintErrors.societyId && <div style={{ color: COLORS.danger, fontSize: "12px", marginTop: "6px" }}>{complaintErrors.societyId}</div>}
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Resident (optional)</label>
                <select value={complaintForm.residentId} onChange={(event) => setComplaintForm((prev) => ({ ...prev, residentId: event.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}>
                  <option value="">None</option>
                  {residents.filter((res) => res.societyId === complaintForm.societyId).map((resident) => (<option key={resident.id} value={resident.id}>{resident.name}</option>))}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "1fr 1fr", marginTop: "14px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Category</label>
                <select value={complaintForm.category} onChange={(event) => setComplaintForm((prev) => ({ ...prev, category: event.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}>
                  <option>Infrastructure</option>
                  <option>Safety</option>
                  <option>Services</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Priority</label>
                <select value={complaintForm.priority} onChange={(event) => setComplaintForm((prev) => ({ ...prev, priority: event.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "1fr 1fr", marginTop: "14px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Status</label>
                <select value={complaintForm.status} onChange={(event) => setComplaintForm((prev) => ({ ...prev, status: event.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}>
                  <option>Open</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "22px" }}>
              <Button variant="secondary" type="button" onClick={closeComplaintModal}>Cancel</Button>
              <Button type="submit">Save Complaint</Button>
            </div>
          </form>
        </Modal>
      )}

      {noticeModalOpen && (
        <Modal title={noticeForm.id ? "Edit Notice" : "Publish Notice"} onClose={closeNoticeModal}>
          <form onSubmit={handleNoticeSave}>
            <Input label="Title" value={noticeForm.title} onChange={(event) => setNoticeForm((prev) => ({ ...prev, title: event.target.value }))} error={noticeErrors.title} />
            <Input label="Message" value={noticeForm.message} onChange={(event) => setNoticeForm((prev) => ({ ...prev, message: event.target.value }))} error={noticeErrors.message} />
            <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "1fr 1fr" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Target Society</label>
                <select value={noticeForm.target} onChange={(event) => setNoticeForm((prev) => ({ ...prev, target: event.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}>
                  <option value="All">All</option>
                  {societyOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Notice Type</label>
                <select value={noticeForm.type} onChange={(event) => setNoticeForm((prev) => ({ ...prev, type: event.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}>
                  <option>General</option>
                  <option>Urgent</option>
                  <option>Event</option>
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "1fr 1fr" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Publish Date</label>
                <input type="date" value={noticeForm.publishDate} onChange={(event) => setNoticeForm((prev) => ({ ...prev, publishDate: event.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }} />
                {noticeErrors.publishDate && <div style={{ color: COLORS.danger, fontSize: "12px", marginTop: "6px" }}>{noticeErrors.publishDate}</div>}
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: COLORS.muted, fontSize: "12px" }}>Expiry Date</label>
                <input type="date" value={noticeForm.expiryDate} onChange={(event) => setNoticeForm((prev) => ({ ...prev, expiryDate: event.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }} />
                {noticeErrors.expiryDate && <div style={{ color: COLORS.danger, fontSize: "12px", marginTop: "6px" }}>{noticeErrors.expiryDate}</div>}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "22px" }}>
              <Button variant="secondary" type="button" onClick={closeNoticeModal}>Cancel</Button>
              <Button type="submit">Save Notice</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

const SectionHeader = ({ title, description, actionLabel, onAction }) => (
  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
    <div>
      <h2 style={{ fontSize: "24px", margin: 0, color: COLORS.text }}>{title}</h2>
      <p style={{ margin: "10px 0 0", color: COLORS.muted }}>{description}</p>
    </div>
    <Button variant="primary" type="button" onClick={onAction}>{actionLabel}</Button>
  </div>
);

const MiniStat = ({ label, value }) => (
  <div style={{ padding: "16px", borderRadius: "16px", background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
    <div style={{ fontSize: "12px", color: COLORS.muted, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
    <div style={{ fontSize: "20px", fontWeight: 700, color: COLORS.text }}>{value}</div>
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "18px" }}>
    <div style={{ width: "100%", maxWidth: "760px", background: COLORS.surface, borderRadius: "24px", boxShadow: "0 24px 80px rgba(0,0,0,0.45)", padding: "24px", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
        <div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: COLORS.text }}>{title}</div>
        </div>
        <button type="button" onClick={onClose} style={{ border: "none", background: "transparent", color: COLORS.muted, fontSize: "22px", cursor: "pointer" }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

export default AdminDashboard;
