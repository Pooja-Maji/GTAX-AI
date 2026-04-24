import {
  Box,
  Button,
  Typography,
  useMediaQuery,
  CircularProgress,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { useState, type ChangeEvent } from "react";
import Row1 from "./Row1";
import Row2 from "./Row2";
import Row3 from "./Row3";
import { useGetInvoicesQuery, useGetGSTSummaryQuery } from "@/state/api";

const gridTemplateLargeScreens = `
  "a b c"
  "a b c"
  "a b c"
  "a b f"
  "d e f"
  "d e f"
  "d h i"
  "g h i"
  "g h j"
  "g h j"
`;

const gridTemplateSmallScreens = `
  "a" "a" "a" "a"
  "b" "b" "b" "b"
  "c" "c" "c"
  "d" "d" "d"
  "e" "e"
  "f" "f" "f"
  "g" "g" "g"
  "h" "h" "h" "h"
  "i" "i"
  "j" "j"
`;

interface UploadState {
  loading: boolean;
  success: boolean;
  error: string | null;
  fileName: string;
  count: number;
}

const Dashboard = () => {
  const isAboveMediumScreens = useMediaQuery("(min-width: 900px)");

  // Refetch hooks for data refresh after upload
  const { refetch: refetchInvoices } = useGetInvoicesQuery();
  const { refetch: refetchSummary } = useGetGSTSummaryQuery();

  const [invoiceUpload, setInvoiceUpload] = useState<UploadState>({
    loading: false,
    success: false,
    error: null,
    fileName: "",
    count: 0,
  });

  const [gstr2bUpload, setGstr2bUpload] = useState<UploadState>({
    loading: false,
    success: false,
    error: null,
    fileName: "",
    count: 0,
  });

  // Validate CSV file
  const validateCSVFile = (file: File): { valid: boolean; error?: string } => {
    // Check file extension
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return { valid: false, error: "Please select a CSV file" };
    }

    // Check MIME type
    const validTypes = ["text/csv", "application/vnd.ms-excel", "text/plain"];
    if (!validTypes.includes(file.type) && file.type !== "") {
      return {
        valid: false,
        error: "Invalid file type. Only CSV files are allowed",
      };
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: "File size exceeds 10MB limit" };
    }

    return { valid: true };
  };

  const handleUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    type: "invoices" | "gstr2b",
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateCSVFile(file);
    if (!validation.valid) {
      const setState = type === "invoices" ? setInvoiceUpload : setGstr2bUpload;
      setState({
        loading: false,
        success: false,
        error: validation.error!,
        fileName: file.name,
        count: 0,
      });
      alert(`❌ ${validation.error}`);
      event.target.value = ""; // Reset input
      return;
    }

    // Set loading state
    const setState = type === "invoices" ? setInvoiceUpload : setGstr2bUpload;
    setState({
      loading: true,
      success: false,
      error: null,
      fileName: file.name,
      count: 0,
    });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`http://localhost:9000/upload/${type}`, {
        method: "POST",
        body: formData,
      });

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log(`${type} Uploaded Data:`, result);

      const dataCount = result.data?.length || 0;

      setState({
        loading: false,
        success: true,
        error: null,
        fileName: file.name,
        count: dataCount,
      });

      // Show success alert
      alert(
        `✅ ${type === "invoices" ? "Invoices" : "GSTR2B"} uploaded successfully!\n\n📊 ${dataCount} records loaded`,
      );

      // Refetch data to update charts
      await Promise.all([refetchInvoices(), refetchSummary()]);
    } catch (error) {
      console.error(`${type} upload error:`, error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      setState({
        loading: false,
        success: false,
        error: errorMessage,
        fileName: file.name,
        count: 0,
      });

      alert(`❌ Upload failed\n\n${errorMessage}`);
    }

    // Reset file input
    event.target.value = "";
  };

  const renderUploadStatus = (upload: UploadState) => {
    if (upload.loading) {
      return (
        <Box display="flex" alignItems="center" gap="0.5rem" mt="0.5rem">
          <CircularProgress size={16} />
          <Typography variant="caption" color="gray">
            Uploading {upload.fileName}...
          </Typography>
        </Box>
      );
    }

    if (upload.success) {
      return (
        <Box display="flex" alignItems="center" gap="0.5rem" mt="0.5rem">
          <CheckCircleIcon sx={{ fontSize: 16, color: "#4cceac" }} />
          <Typography variant="caption" color="#4cceac">
            {upload.fileName} • {upload.count} records
          </Typography>
        </Box>
      );
    }

    if (upload.error) {
      return (
        <Box display="flex" alignItems="center" gap="0.5rem" mt="0.5rem">
          <ErrorIcon sx={{ fontSize: 16, color: "#ff5252" }} />
          <Typography variant="caption" color="#ff5252">
            {upload.error}
          </Typography>
        </Box>
      );
    }

    return (
      <Typography variant="caption" mt="0.5rem" display="block" color="gray">
        No file selected
      </Typography>
    );
  };

  return (
    <>
      <Box
        sx={{
          m: "1.5rem 2.5rem 0 2.5rem",
          p: "1.5rem",
          backgroundColor: "#1f2a40",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Typography variant="h5" fontWeight="600" mb="1rem">
          Upload Data
        </Typography>

        <Box
          display="flex"
          flexDirection={{ xs: "column", md: "row" }}
          gap="1.5rem"
        >
          {/* Invoices Upload */}
          <Box flex={1}>
            <Typography variant="body2" mb="0.5rem" color="gray">
              Invoices (CSV only)
            </Typography>

            <Button
              variant="contained"
              startIcon={
                invoiceUpload.loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <UploadFileIcon />
                )
              }
              component="label"
              fullWidth
              disabled={invoiceUpload.loading}
              sx={{
                backgroundColor: invoiceUpload.loading ? "#666" : "#4cceac",
                color: "#000",
                fontWeight: "600",
                "&:hover": {
                  backgroundColor: invoiceUpload.loading ? "#666" : "#3da58a",
                },
                "&:disabled": { backgroundColor: "#666", color: "#999" },
              }}
            >
              {invoiceUpload.loading ? "Uploading..." : "Upload Invoices"}
              <input
                type="file"
                hidden
                accept=".csv"
                onChange={(e) => handleUpload(e, "invoices")}
                disabled={invoiceUpload.loading}
              />
            </Button>

            {renderUploadStatus(invoiceUpload)}
          </Box>

          {/* GSTR2B Upload */}
          <Box flex={1}>
            <Typography variant="body2" mb="0.5rem" color="gray">
              GSTR2B (CSV only)
            </Typography>

            <Button
              variant="contained"
              startIcon={
                gstr2bUpload.loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <UploadFileIcon />
                )
              }
              component="label"
              fullWidth
              disabled={gstr2bUpload.loading}
              sx={{
                backgroundColor: gstr2bUpload.loading ? "#666" : "#6870fa",
                color: "#fff",
                fontWeight: "600",
                "&:hover": {
                  backgroundColor: gstr2bUpload.loading ? "#666" : "#4f57d3",
                },
                "&:disabled": { backgroundColor: "#666", color: "#999" },
              }}
            >
              {gstr2bUpload.loading ? "Uploading..." : "Upload GSTR2B"}
              <input
                type="file"
                hidden
                accept=".csv"
                onChange={(e) => handleUpload(e, "gstr2b")}
                disabled={gstr2bUpload.loading}
              />
            </Button>

            {renderUploadStatus(gstr2bUpload)}
          </Box>
        </Box>

        {/* Summary Info */}
        <Box mt="1.5rem" display="flex" gap="2rem" flexWrap="wrap">
          <Typography
            variant="body2"
            color={invoiceUpload.success ? "#4cceac" : "gray"}
          >
            📄 Invoices loaded: {invoiceUpload.count}
          </Typography>
          <Typography
            variant="body2"
            color={gstr2bUpload.success ? "#6870fa" : "gray"}
          >
            🧾 GSTR2B loaded: {gstr2bUpload.count}
          </Typography>
        </Box>
      </Box>

      {/* Dashboard Charts */}
      <Box
        m="1.5rem 2.5rem"
        width="100%"
        height="100%"
        display="grid"
        gap="1.5rem"
        sx={
          isAboveMediumScreens
            ? {
                gridTemplateColumns: "repeat(3, minmax(370px, 1fr))",
                gridTemplateRows: "repeat(10, minmax(60px, 1fr))",
                gridTemplateAreas: gridTemplateLargeScreens,
              }
            : {
                gridAutoColumns: "1fr",
                gridAutoRows: "80px",
                gridTemplateAreas: gridTemplateSmallScreens,
              }
        }
      >
        <Row1 />
        <Row2 />
        <Row3 />
      </Box>
    </>
  );
};

export default Dashboard;