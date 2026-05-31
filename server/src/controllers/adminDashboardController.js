const Society = require("../module/Society");
const User = require("../module/User");
const MaintenanceBill = require("../module/MaintenanceBill");
const Complaint = require("../module/Complaint");
const Notice = require("../module/Notice");
const Visitor = require("../module/Visitor");

const toExternalId = (doc) => (doc.externalId || doc._id.toString());
const parseDate = (value) => (value ? new Date(value) : null);

const normalizeString = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") {
    if (value.tier) return String(value.tier);
    if (value.name) return String(value.name);
    if (value.status) return String(value.status);
    if (value.label) return String(value.label);
    return JSON.stringify(value);
  }
  return String(value);
};

const mapStatusToDb = (status) => {
  if (!status) return "pending";
  if (status === "Unpaid") return "pending";
  if (status === "Paid") return "paid";
  if (status === "Overdue") return "overdue";
  if (status === "Waived") return "waived";
  return status.toLowerCase();
};

const mapStatusFromDb = (status) => {
  if (!status) return "Unpaid";
  if (status === "pending") return "Unpaid";
  if (status === "paid") return "Paid";
  if (status === "overdue") return "Overdue";
  if (status === "waived") return "Waived";
  return status;
};

const mapComplaintStatusToDb = (status) => {
  if (!status) return "submitted";
  if (status === "Open") return "submitted";
  if (status === "In Progress") return "in_progress";
  if (status === "Resolved") return "resolved";
  return status.toLowerCase();
};

const mapComplaintStatusFromDb = (status) => {
  if (!status) return "Open";
  if (status === "submitted") return "Open";
  if (status === "in_progress") return "In Progress";
  if (status === "resolved") return "Resolved";
  return status;
};

const mapNoticeTypeToPriority = (type) => {
  if (type === "Urgent") return "important";
  if (type === "Emergency") return "emergency";
  return "normal";
};

const mapNoticeTypeFromDb = (priority) => {
  if (priority === "important") return "Urgent";
  if (priority === "emergency") return "Emergency";
  return "General";
};

const getAccessibleSocietyFilter = (user) => {
  if (user.role === "super_admin") return {};
  if (user.society) return { _id: user.society };
  return { _id: null };
};

const getDashboardStateFilters = (user, societyIds) => {
  const societyFilter = user.role === "super_admin" ? {} : { society: { $in: societyIds } };

  const residentFilter = user.role === "resident"
    ? { _id: user._id }
    : { role: "resident", society: { $in: societyIds } };

  const billFilter = user.role === "resident"
    ? { society: { $in: societyIds }, resident: user._id }
    : { society: { $in: societyIds } };

  const complaintFilter = user.role === "resident"
    ? { society: { $in: societyIds }, raisedBy: user._id }
    : { society: { $in: societyIds } };

  const noticeFilter = user.role === "super_admin" ? {} : { society: { $in: societyIds } };

  return { societyFilter, residentFilter, billFilter, complaintFilter, noticeFilter };
};

const toSocietyResponse = (society) => ({
  id: toExternalId(society),
  name: society.name,
  city: society.address?.city || society.city || "",
  address: society.address || { line1: "", city: society.city || "", state: society.state || "", pincode: society.pincode || "" },
  totalUnits: society.totalUnits,
  adminName: society.adminName || "",
  status: society.status || (society.isActive ? "Active" : "Inactive"),
  registeredAt: society.createdAt?.toISOString().slice(0, 10) || new Date().toISOString().slice(0, 10),
  plan: normalizeString(society.plan, "Premium") || "Premium",
  billingStatus: normalizeString(society.billingStatus, "Current") || "Current",
  activity: society.activity || [],
});

const toResidentResponse = (resident) => ({
  id: toExternalId(resident),
  name: resident.name,
  unitNumber: resident.flatNumber || "",
  societyId: toExternalId(resident.society || {}),
  contact: resident.phone || "",
  email: resident.email || "",
  moveInDate: resident.moveInDate?.toISOString().slice(0, 10) || resident.createdAt?.toISOString().slice(0, 10) || new Date().toISOString().slice(0, 10),
  status: resident.status || (resident.isActive ? "Active" : "Inactive"),
});

const toBillResponse = (bill, residentMap, societyMap) => ({
  id: toExternalId(bill),
  type: bill.type || "Maintenance",
  amount: bill.amount,
  dueDate: bill.dueDate?.toISOString().slice(0, 10) || "",
  societyId: societyMap.get(bill.society?.toString()) || toExternalId(bill.society || {}),
  residentId: residentMap.get(bill.resident?.toString()) || toExternalId(bill.resident || {}),
  status: mapStatusFromDb(bill.status),
  createdAt: bill.createdAt?.toISOString().slice(0, 10) || "",
});

const toComplaintResponse = (complaint, residentMap, societyMap) => ({
  id: toExternalId(complaint),
  title: complaint.title,
  description: complaint.description,
  societyId: societyMap.get(complaint.society?.toString()) || toExternalId(complaint.society || {}),
  residentId: complaint.resident ? residentMap.get(complaint.resident.toString()) : complaint.raisedBy ? residentMap.get(complaint.raisedBy.toString()) : "",
  category: complaint.category || "Other",
  priority: complaint.priority ? complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1) : "Medium",
  status: mapComplaintStatusFromDb(complaint.status),
  createdAt: complaint.createdAt?.toISOString().slice(0, 10) || "",
});

const toNoticeResponse = (notice) => ({
  id: toExternalId(notice),
  title: notice.title,
  message: notice.body || notice.message || "",
  target: notice.target || "All",
  type: notice.type || mapNoticeTypeFromDb(notice.priority),
  publishDate: notice.publishDate?.toISOString().slice(0, 10) || notice.createdAt?.toISOString().slice(0, 10) || "",
  expiryDate: notice.expiryDate?.toISOString().slice(0, 10) || notice.expiresAt?.toISOString().slice(0, 10) || "",
});

exports.getDashboardState = async (req, res, next) => {
  try {
    const societyFilter = getAccessibleSocietyFilter(req.user);
    const societies = await Society.find(societyFilter).lean();
    const societyIds = societies.map((soc) => soc._id);

    const societyMap = new Map(societies.map((soc) => [soc._id.toString(), toExternalId(soc)]));

    const residentFilter = req.user.role === "resident"
      ? { _id: req.user._id }
      : { role: "resident", society: { $in: societyIds } };

    const billFilter = req.user.role === "resident"
      ? { society: { $in: societyIds }, resident: req.user._id }
      : { society: { $in: societyIds } };

    const complaintFilter = req.user.role === "resident"
      ? { society: { $in: societyIds }, raisedBy: req.user._id }
      : { society: { $in: societyIds } };

    const noticeFilter = { society: { $in: societyIds }, isArchived: false };

    const visitorFilter = req.user.role === "guard"
      ? { society: { $in: societyIds } }
      : { society: { $in: societyIds } };

    const [residents, bills, complaints, notices, visitors] = await Promise.all([
      User.find(residentFilter).lean(),
      MaintenanceBill.find(billFilter).lean(),
      Complaint.find(complaintFilter).lean(),
      Notice.find(noticeFilter).lean(),
      Visitor.find(visitorFilter).lean(),
    ]);

    const residentMap = new Map(residents.map((res) => [res._id.toString(), toExternalId(res)]));

    const summary = {
      totalResidents: req.user.role === "resident"
        ? 1
        : await User.countDocuments({ role: "resident", society: { $in: societyIds } }),
      unpaidBills: await MaintenanceBill.countDocuments(
        req.user.role === "resident"
          ? { society: { $in: societyIds }, resident: req.user._id, status: "pending" }
          : { society: { $in: societyIds }, status: "pending" }
      ),
      pendingComplaints: await Complaint.countDocuments(
        req.user.role === "resident"
          ? { society: { $in: societyIds }, raisedBy: req.user._id, status: { $in: ["submitted", "acknowledged", "assigned", "in_progress"] } }
          : { society: { $in: societyIds }, status: { $in: ["submitted", "acknowledged", "assigned", "in_progress"] } }
      ),
      activeNotices: await Notice.countDocuments({ society: { $in: societyIds }, isArchived: false }),
      pendingVisitorApprovals: await Visitor.countDocuments({ society: { $in: societyIds }, status: "pending" }),
    };

    const state = {
      societies: societies.map(toSocietyResponse),
      residents: req.user.role === "resident" ? residents.map(toResidentResponse) : residents.map(toResidentResponse),
      bills: bills.map((bill) => toBillResponse(bill, residentMap, societyMap)),
      complaints: complaints.map((complaint) => toComplaintResponse(complaint, residentMap, societyMap)),
      notices: notices.map(toNoticeResponse),
    };

    if (req.user.role === "guard") {
      state.visitors = visitors.map((visitor) => ({
        id: toExternalId(visitor),
        name: visitor.name,
        phone: visitor.phone,
        hostId: visitor.host?.toString() || "",
        purpose: visitor.purpose,
        status: visitor.status,
        expectedDate: visitor.expectedDate?.toISOString().slice(0, 10) || "",
        entryTime: visitor.entryTime?.toISOString() || null,
        exitTime: visitor.exitTime?.toISOString() || null,
      }));
      state.bills = [];
      state.complaints = [];
    }

    res.json({ success: true, state, summary });
  } catch (err) {
    next(err);
  }
};

const buildSocietyDoc = (state) => ({
  externalId: state.id,
  name: state.name,
  address: {
    line1: state.address?.line1 || state.address?.lineOne || "",
    city: state.city || state.address?.city || "",
    state: state.address?.state || "",
    pincode: state.address?.pincode || "",
  },
  totalUnits: Number(state.totalUnits) || 0,
  adminName: state.adminName || "",
  status: normalizeString(state.status, "Active") || "Active",
  plan: normalizeString(state.plan, "Premium") || "Premium",
  billingStatus: normalizeString(state.billingStatus, "Current") || "Current",
  activity: state.activity || [],
  isActive: normalizeString(state.status, "Active") !== "Inactive",
});

const buildResidentDoc = (state, societyMap) => ({
  externalId: state.id,
  name: state.name,
  email: state.email,
  phone: state.contact,
  role: "resident",
  society: societyMap.get(state.societyId),
  flatNumber: state.unitNumber || "",
  moveInDate: parseDate(state.moveInDate),
  status: state.status || "Active",
  isActive: state.status !== "Inactive",
});

const buildBillDoc = (state, societyMap, residentMap) => ({
  externalId: state.id,
  type: state.type || "Maintenance",
  amount: Number(state.amount) || 0,
  dueDate: parseDate(state.dueDate),
  society: societyMap.get(state.societyId),
  resident: state.residentId ? residentMap.get(state.residentId) : undefined,
  status: mapStatusToDb(state.status),
  billingMonth: state.dueDate ? state.dueDate.slice(0, 7) : undefined,
  totalDue: Number(state.amount) || 0,
  notes: state.notes || "",
});

const buildComplaintDoc = (state, societyMap, residentMap) => ({
  externalId: state.id,
  title: state.title,
  description: state.description,
  society: societyMap.get(state.societyId),
  resident: state.residentId ? residentMap.get(state.residentId) : undefined,
  raisedBy: state.residentId ? residentMap.get(state.residentId) : undefined,
  category: state.category ? state.category.toLowerCase() : "other",
  priority: state.priority ? state.priority.toLowerCase() : "medium",
  status: mapComplaintStatusToDb(state.status),
});

const buildNoticeDoc = (state, societyMap, user) => ({
  externalId: state.id,
  title: state.title,
  body: state.message || state.body || "",
  message: state.message || state.body || "",
  type: state.type || "General",
  priority: mapNoticeTypeToPriority(state.type),
  target: state.target || "All",
  society: state.target && state.target !== "All" ? societyMap.get(state.target) : user.society || Array.from(societyMap.values())[0],
  publishDate: parseDate(state.publishDate),
  expiryDate: parseDate(state.expiryDate),
  expiresAt: parseDate(state.expiryDate),
  createdBy: user._id,
});

const upsertDocuments = async (Model, items, buildDoc, buildFilter, extraFilter = {}) => {
  const externalIds = [];

  for (const item of items) {
    const externalId = item.id || item.externalId;
    const doc = buildDoc(item);
    const query = typeof buildFilter === "function"
      ? buildFilter(item, extraFilter)
      : { externalId, ...extraFilter };

    if (externalId && !query.externalId) {
      query.externalId = externalId;
    }

    externalIds.push(externalId);
    await Model.findOneAndUpdate(
      query,
      { $set: doc, $setOnInsert: { externalId } },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    );
  }

  return externalIds;
};

exports.saveDashboardState = async (req, res, next) => {
  try {
    const state = req.body || {};
    const societyFilter = getAccessibleSocietyFilter(req.user);
    const societiesInScope = await Society.find(societyFilter).lean();
    const societyMap = new Map(societiesInScope.map((soc) => [toExternalId(soc), soc._id]));

    const buildSocietyFilter = (item, extraFilter = {}) => {
      const filter = { ...extraFilter };
      const externalId = item.id || item.externalId;
      if (externalId) {
        filter.externalId = externalId;
        return filter;
      }
      if (item.name) {
        filter.name = item.name;
        if (item.address?.city) filter['address.city'] = item.address.city;
        if (item.address?.line1) filter['address.line1'] = item.address.line1;
      }
      return filter;
    };

    const buildResidentFilter = (item, extraFilter = {}) => {
      const filter = { ...extraFilter };
      const externalId = item.id || item.externalId;
      if (externalId) {
        filter.externalId = externalId;
        return filter;
      }
      if (item.email) filter.email = item.email;
      if (!filter.email && item.name) filter.name = item.name;
      if (item.societyId && societyMap.has(item.societyId)) filter.society = societyMap.get(item.societyId);
      return filter;
    };

    const buildBillFilter = (item, extraFilter = {}) => {
      const filter = { ...extraFilter };
      const externalId = item.id || item.externalId;
      if (externalId) {
        filter.externalId = externalId;
        return filter;
      }
      if (item.invoiceNumber) filter.invoiceNumber = item.invoiceNumber;
      if (item.societyId && societyMap.has(item.societyId)) filter.society = societyMap.get(item.societyId);
      if (item.residentId && residentMap.has(item.residentId)) filter.resident = residentMap.get(item.residentId);
      if (item.billingMonth) filter.billingMonth = item.billingMonth;
      return filter;
    };

    const buildComplaintFilter = (item, extraFilter = {}) => {
      const filter = { ...extraFilter };
      const externalId = item.id || item.externalId;
      if (externalId) {
        filter.externalId = externalId;
        return filter;
      }
      if (item.title) filter.title = item.title;
      if (item.societyId && societyMap.has(item.societyId)) filter.society = societyMap.get(item.societyId);
      if (item.residentId && residentMap.has(item.residentId)) filter.raisedBy = residentMap.get(item.residentId);
      if (item.category) filter.category = item.category.toLowerCase();
      return filter;
    };

    const buildNoticeFilter = (item, extraFilter = {}) => {
      const filter = { ...extraFilter };
      const externalId = item.id || item.externalId;
      if (externalId) {
        filter.externalId = externalId;
        return filter;
      }
      if (item.title) filter.title = item.title;
      if (item.publishDate) filter.publishDate = parseDate(item.publishDate);
      if (item.societyId && societyMap.has(item.societyId)) filter.society = societyMap.get(item.societyId);
      return filter;
    };

    const societyExternalIds = await upsertDocuments(Society, state.societies || [], buildSocietyDoc, buildSocietyFilter, societyFilter);
    const societiesUpdated = await Society.find({ externalId: { $in: societyExternalIds.filter(Boolean) } }).lean();
    societiesUpdated.forEach((soc) => societyMap.set(toExternalId(soc), soc._id));

    const residentExternalIds = await upsertDocuments(User, state.residents || [], (item) => buildResidentDoc(item, societyMap), buildResidentFilter, { role: 'resident' });
    const residentsUpdated = await User.find({ externalId: { $in: residentExternalIds.filter(Boolean) } }).lean();
    const residentMap = new Map(residentsUpdated.map((res) => [toExternalId(res), res._id]));

    await upsertDocuments(MaintenanceBill, state.bills || [], (item) => buildBillDoc(item, societyMap, residentMap), buildBillFilter, societyFilter);
    await upsertDocuments(Complaint, state.complaints || [], (item) => buildComplaintDoc(item, societyMap, residentMap), buildComplaintFilter, societyFilter);
    await upsertDocuments(Notice, state.notices || [], (item) => buildNoticeDoc(item, societyMap, req.user), buildNoticeFilter, societyFilter);

    res.json({ success: true, message: 'Dashboard state synchronized to database' });
  } catch (err) {
    next(err);
  }
};
