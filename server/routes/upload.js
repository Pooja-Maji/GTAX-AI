import express from "express";
import multer from "multer";
import XLSX from "xlsx";
import { setInvoices, setGstr2b } from "../data/gstData.js";

const router = express.Router();

// Keep file in memory, so we do not need to save it on disk
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv", // .csv
      "application/csv",
      "text/plain",
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel and CSV files are allowed"));
    }
  },
});

// Works for both Excel and CSV files
function parseFileBuffer(buffer) {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    raw: true,
  });

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  return {
    sheetName,
    rowCount: rows.length,
    rows,
  };
}

// POST /upload/invoices
// POST /upload/gstr2b
router.post("/:type", upload.single("file"), (req, res) => {
  try {
    const { type } = req.params;

    if (!["invoices", "gstr2b"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be either 'invoices' or 'gstr2b'",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const result = parseFileBuffer(req.file.buffer);

    // Mutate in-place so all route imports see the new data immediately
    if (type === "invoices") {
      setInvoices(result.rows);
    } else {
      setGstr2b(result.rows);
    }

    return res.status(200).json({
      success: true,
      message: `${type} file uploaded and parsed successfully`,
      type,
      fileName: req.file.originalname,
      sheetName: result.sheetName,
      rowCount: result.rowCount,
      data: result.rows,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to parse file",
      error: error.message,
    });
  }
});

export default router;