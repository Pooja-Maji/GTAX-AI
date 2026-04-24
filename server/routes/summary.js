import express from "express";
import { getComputedSummary } from "../data/gstData.js";

const router = express.Router();

// GET /summary/gst-summary
router.get("/gst-summary", async (req, res) => {
  try {
    res.status(200).json(getComputedSummary());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;