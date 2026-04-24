export const invoices = [
  { _id: "inv001", invoiceNumber: "INV-2024-0112", gstin: "29AABCA1234F1Z5", vendorName: "Apex Supplies Pvt Ltd", date: "2024-03-18", taxableAmount: 48500, cgst: 4365, sgst: 4365, igst: 0, totalAmount: 57230, status: "matched", confidenceScore: 97 },
  { _id: "inv002", invoiceNumber: "INV-2024-0108", gstin: "24AADCN5678K1Z2", vendorName: "Nirma Industrial Co", date: "2024-03-15", taxableAmount: 32000, cgst: 0, sgst: 0, igst: 5760, totalAmount: 37760, status: "mismatch", confidenceScore: 43 },
  { _id: "inv003", invoiceNumber: "INV-2024-0105", gstin: "27AAAPR4567L1Z8", vendorName: "Rajesh Traders", date: "2024-03-12", taxableAmount: 19200, cgst: 1728, sgst: 1728, igst: 0, totalAmount: 22656, status: "matched", confidenceScore: 91 },
  { _id: "inv004", invoiceNumber: "INV-2024-0101", gstin: "36AABCS2345M1Z0", vendorName: "Sri Durga Enterprises", date: "2024-03-10", taxableAmount: 67800, cgst: 0, sgst: 0, igst: 12204, totalAmount: 80004, status: "mismatch", confidenceScore: 29 },
  { _id: "inv005", invoiceNumber: "INV-2024-0098", gstin: "33AACCT7890N1Z4", vendorName: "TechParts India Ltd", date: "2024-03-08", taxableAmount: 11500, cgst: 1035, sgst: 1035, igst: 0, totalAmount: 13570, status: "pending", confidenceScore: 68 },
  { _id: "inv006", invoiceNumber: "INV-2024-0095", gstin: "08AABCB3456P1Z7", vendorName: "Bharat Steel Works", date: "2024-03-05", taxableAmount: 92000, cgst: 0, sgst: 0, igst: 16560, totalAmount: 108560, status: "matched", confidenceScore: 99 },
  { _id: "inv007", invoiceNumber: "INV-2024-0091", gstin: "29AACKD6789Q1Z1", vendorName: "Krishna Distributors", date: "2024-03-02", taxableAmount: 28400, cgst: 2556, sgst: 2556, igst: 0, totalAmount: 33512, status: "mismatch", confidenceScore: 38 },
  { _id: "inv008", invoiceNumber: "INV-2024-0088", gstin: "06AACCP8901R1Z3", vendorName: "Pioneer Components", date: "2024-02-28", taxableAmount: 54200, cgst: 4878, sgst: 4878, igst: 0, totalAmount: 63956, status: "matched", confidenceScore: 94 },
  { _id: "inv009", invoiceNumber: "INV-2024-0084", gstin: "29AAACS9012S1Z6", vendorName: "Sunrise Metals Pvt", date: "2024-02-25", taxableAmount: 38700, cgst: 0, sgst: 0, igst: 6966, totalAmount: 45666, status: "pending", confidenceScore: 72 },
  { _id: "inv010", invoiceNumber: "INV-2024-0081", gstin: "19AABCM0123T1Z9", vendorName: "Metro Fasteners Ltd", date: "2024-02-22", taxableAmount: 16900, cgst: 1521, sgst: 1521, igst: 0, totalAmount: 19942, status: "matched", confidenceScore: 88 },
  { _id: "inv011", invoiceNumber: "INV-2024-0077", gstin: "27AADCR1234U1Z2", vendorName: "Royal Chemicals Co", date: "2024-02-18", taxableAmount: 73500, cgst: 0, sgst: 0, igst: 13230, totalAmount: 86730, status: "mismatch", confidenceScore: 31 },
  { _id: "inv012", invoiceNumber: "INV-2024-0074", gstin: "29AAACT2345V1Z5", vendorName: "TechParts India Ltd", date: "2024-02-14", taxableAmount: 22100, cgst: 1989, sgst: 1989, igst: 0, totalAmount: 26078, status: "matched", confidenceScore: 85 },
];

export const gstr2b = [];

// Mutate in-place — routes imported these array references at startup.
// splice keeps the same reference alive so all importers see the new rows.
export function setInvoices(newRows) {
  invoices.splice(0, invoices.length, ...newRows);
}

export function setGstr2b(newRows) {
  gstr2b.splice(0, gstr2b.length, ...newRows);
}

// Derives all chart data from whatever is currently in the invoices array.
// Called by summary.js on every GET so the response always reflects uploads.
const MONTH_ORDER = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function getComputedSummary() {
  const matched    = invoices.filter((i) => i.status === "matched").length;
  const mismatched = invoices.filter((i) => i.status === "mismatch").length;
  const pending    = invoices.filter((i) => i.status === "pending").length;
  const total      = invoices.length;

  const totalITC   = invoices.reduce((s, i) => s + (Number(i.cgst) + Number(i.sgst) + Number(i.igst)), 0);
  const itcAtRisk  = invoices
    .filter((i) => i.status === "mismatch")
    .reduce((s, i) => s + (Number(i.cgst) + Number(i.sgst) + Number(i.igst)), 0);
  const gstPayable = invoices.reduce((s, i) => s + Number(i.taxableAmount) * 0.18, 0);
  const healthScore = total > 0 ? Math.round((matched / total) * 100) : 0;

  // Monthly reconciliation buckets
  const reconMap = {};
  invoices.forEach((inv) => {
    const month = new Date(inv.date).toLocaleString("en-IN", { month: "short" });
    if (!reconMap[month]) reconMap[month] = { month, matched: 0, mismatch: 0, pending: 0 };
    if (inv.status === "matched")       reconMap[month].matched++;
    else if (inv.status === "mismatch") reconMap[month].mismatch++;
    else                                reconMap[month].pending++;
  });
  const monthlyReconciliation = Object.values(reconMap).sort(
    (a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month)
  );

  // ITC risk trend buckets
  const itcMap = {};
  invoices
    .filter((i) => i.status === "mismatch")
    .forEach((inv) => {
      const month = new Date(inv.date).toLocaleString("en-IN", { month: "short" });
      if (!itcMap[month]) itcMap[month] = { month, amount: 0 };
      itcMap[month].amount += Number(inv.cgst) + Number(inv.sgst) + Number(inv.igst);
    });
  const itcRiskTrend = Object.values(itcMap).sort(
    (a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month)
  );

  return {
    _id: "sum_computed",
    period: "Uploaded Data",
    totalInvoices: total,
    matchedInvoices: matched,
    mismatchedInvoices: mismatched,
    pendingInvoices: pending,
    totalITC,
    itcAtRisk,
    gstPayable,
    healthScore,
    monthlyReconciliation,
    itcRiskTrend,
  };
}

export const vendors = [
  { _id: "ven001", name: "Bharat Steel Works", gstin: "08AABCB3456P1Z7", complianceScore: 94, riskLevel: "Low", totalInvoices: 28, mismatchCount: 1 },
  { _id: "ven002", name: "Rajesh Traders", gstin: "27AAAPR4567L1Z8", complianceScore: 82, riskLevel: "Low", totalInvoices: 19, mismatchCount: 2 },
  { _id: "ven003", name: "Apex Supplies Pvt Ltd", gstin: "29AABCA1234F1Z5", complianceScore: 76, riskLevel: "Low", totalInvoices: 34, mismatchCount: 4 },
  { _id: "ven004", name: "Pioneer Components", gstin: "06AACCP8901R1Z3", complianceScore: 71, riskLevel: "Medium", totalInvoices: 22, mismatchCount: 3 },
  { _id: "ven005", name: "Sunrise Metals Pvt", gstin: "29AAACS9012S1Z6", complianceScore: 64, riskLevel: "Medium", totalInvoices: 15, mismatchCount: 4 },
  { _id: "ven006", name: "TechParts India Ltd", gstin: "33AACCT7890N1Z4", complianceScore: 61, riskLevel: "Medium", totalInvoices: 18, mismatchCount: 5 },
  { _id: "ven007", name: "Metro Fasteners Ltd", gstin: "19AABCM0123T1Z9", complianceScore: 58, riskLevel: "Medium", totalInvoices: 11, mismatchCount: 3 },
  { _id: "ven008", name: "Krishna Distributors", gstin: "29AACKD6789Q1Z1", complianceScore: 51, riskLevel: "High", totalInvoices: 24, mismatchCount: 9 },
  { _id: "ven009", name: "Nirma Industrial Co", gstin: "24AADCN5678K1Z2", complianceScore: 38, riskLevel: "High", totalInvoices: 16, mismatchCount: 8 },
  { _id: "ven010", name: "Royal Chemicals Co", gstin: "27AADCR1234U1Z2", complianceScore: 34, riskLevel: "High", totalInvoices: 9, mismatchCount: 6 },
  { _id: "ven011", name: "Sri Durga Enterprises", gstin: "36AABCS2345M1Z0", complianceScore: 21, riskLevel: "High", totalInvoices: 7, mismatchCount: 5 },
];

export const alerts = [
  { _id: "alt001", type: "ITC_MISMATCH", message: "INV-2024-0101: GSTIN mismatch detected — vendor portal shows ₹3,240 variance in IGST", severity: "High", date: "2024-03-19", status: "open" },
  { _id: "alt002", type: "VENDOR_RISK", message: "Sri Durga Enterprises filed 3 consecutive nil returns — ITC claim of ₹12,204 at risk", severity: "High", date: "2024-03-19", status: "open" },
  { _id: "alt003", type: "FILING_DUE", message: "GSTR-3B due in 12 days (Apr 20, 2024) — 5 invoices still pending reconciliation", severity: "High", date: "2024-03-18", status: "open" },
  { _id: "alt004", type: "ITC_MISMATCH", message: "INV-2024-0108: IGST amount ₹5,760 doesn't match GSTR-2B entry by ₹576 (10% variance)", severity: "Medium", date: "2024-03-18", status: "open" },
  { _id: "alt005", type: "VENDOR_RISK", message: "Krishna Distributors compliance score dropped from 74 → 51 this month", severity: "Medium", date: "2024-03-17", status: "open" },
  { _id: "alt006", type: "ITC_MISMATCH", message: "INV-2024-0077: Royal Chemicals Co — GSTIN inactive on GST portal as of Mar 15", severity: "High", date: "2024-03-16", status: "open" },
  { _id: "alt007", type: "RECONCILE", message: "Auto-reconciliation completed: 187 matched, 41 mismatch, 20 pending out of 248 invoices", severity: "Low", date: "2024-03-15", status: "resolved" },
];