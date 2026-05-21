const Society = require("../module/Society");
const User = require("../module/User");
const MaintenanceBill = require("../module/MaintenanceBill");
const Complaint = require("../module/Complaint");
const Notice = require("../module/Notice");

const toExternalId = (doc) => (doc.externalId || doc._id.toString());
const parseDate = (value) => (value ? new Date(value) : null);

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
  return { _id: user.society };
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
  plan: society.plan || "Premium",
  billingStatus: society.billingStatus || "Current",
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

    const residents = await User.find({ role: "resident", society: { $in: societyIds } }).lean();
    const bills = await MaintenanceBill.find({ society: { $in: societyIds } }).lean();
    const complaints = await Complaint.find({ society: { $in: societyIds } }).lean();
    const notices = await Notice.find({ society: { $in: societyIds } }).lean();

    const societyMap = new Map(societies.map((soc) => [soc._id.toString(), toExternalId(soc)]));
    const residentMap = new Map(residents.map((res) => [res._id.toString(), toExternalId(res)]));

    res.json({
      success: true,
      state: {
        societies: societies.map(toSocietyResponse),
        residents: residents.map(toResidentResponse),
        bills: bills.map((bill) => toBillResponse(bill, residentMap, societyMap)),
        complaints: complaints.map((complaint) => toComplaintResponse(complaint, residentMap, societyMap)),
        notices: notices.map(toNoticeResponse),
      },
    });
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
  status: state.status || "Active",
  plan: state.plan || "Premium",
  billingStatus: state.billingStatus || "Current",
  activity: state.activity || [],
  isActive: state.status !== "Inactive",
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

const upsertDocuments = async (Model, items, buildDoc, extraFilter = {}) => {
  const externalIds = [];

  for (const item of items) {
    const externalId = item.id;
    externalIds.push(externalId);
    const doc = buildDoc(item);
    await Model.findOneAndUpdate(
      { externalId, ...extraFilter },
      doc,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  return externalIds;
};

const deleteMissingDocuments = async (Model, externalIds, filter = {}) => {
  if (!Array.isArray(externalIds)) return;
  await Model.deleteMany({ ...filter, externalId: { $nin: externalIds } });
};

exports.saveDashboardState = async (req, res, next) => {
  try {
    const state = req.body || {};
    const societyFilter = getAccessibleSocietyFilter(req.user);
    const societiesInScope = await Society.find(societyFilter).lean();
    const societyMap = new Map(societiesInScope.map((soc) => [toExternalId(soc), soc._id]));

    const societyExternalIds = await upsertDocuments(Society, state.societies || [], buildSocietyDoc, societyFilter);
    const societiesUpdated = await Society.find({ externalId: { $in: societyExternalIds } }).lean();
    societiesUpdated.forEach((soc) => societyMap.set(toExternalId(soc), soc._id));

    const residentExternalIds = await upsertDocuments(User, state.residents || [], (item) => buildResidentDoc(item, societyMap), { role: "resident" });
    const residentsUpdated = await User.find({ externalId: { $in: residentExternalIds } }).lean();
    const residentMap = new Map(residentsUpdated.map((res) => [toExternalId(res), res._id]));

    const billExternalIds = await upsertDocuments(MaintenanceBill, state.bills || [], (item) => buildBillDoc(item, societyMap, residentMap), societyFilter);
    await upsertDocuments(Complaint, state.complaints || [], (item) => buildComplaintDoc(item, societyMap, residentMap), societyFilter);
    await upsertDocuments(Notice, state.notices || [], (item) => buildNoticeDoc(item, societyMap, req.user), societyFilter);

    await deleteMissingDocuments(User, residentExternalIds, { role: "resident", society: { $in: Array.from(societyMap.values()) } });
    await deleteMissingDocuments(MaintenanceBill, billExternalIds, { society: { $in: Array.from(societyMap.values()) } });
    await deleteMissingDocuments(Complaint, state.complaints?.map((item) => item.id), { society: { $in: Array.from(societyMap.values()) } });
    await deleteMissingDocuments(Notice, state.notices?.map((item) => item.id), { society: { $in: Array.from(societyMap.values()) } });
    await deleteMissingDocuments(Society, societyExternalIds, societyFilter);

    res.json({ success: true, message: "Dashboard state synchronized to database" });
  } catch (err) {
    next(err);
  }
};
