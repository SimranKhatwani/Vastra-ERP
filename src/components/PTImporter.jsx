import React, { useState, useRef, useMemo } from "react";
import {
  UploadCloud,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Edit3,
  Save,
  ArrowLeft,
  Printer,
  Download,
  AlertTriangle,
  RefreshCw,
  FileText,
  Check,
  ChevronRight,
  Eye,
  Trash2,
} from "lucide-react";
import * as XLSX from "xlsx";

const FIELDS_TO_MAP = [
  {
    key: "vendorName",
    label: "Vendor Name",
    required: true,
    synonyms: [
      "vendor",
      "supplier",
      "wholesaler",
      "seller",
      "party",
      "supplier name",
      "vendor name",
    ],
  },
  {
    key: "invoiceNo",
    label: "Invoice Number",
    required: true,
    synonyms: [
      "invoice",
      "bill",
      "inv",
      "voucher",
      "invoice no",
      "bill no",
      "invoice number",
      "bill number",
    ],
  },
  {
    key: "invoiceDate",
    label: "Invoice Date",
    required: true,
    synonyms: ["date", "invoice date", "bill date", "dated", "inv date"],
  },
  {
    key: "fabricCode",
    label: "Fabric Code",
    required: true,
    synonyms: [
      "code",
      "fabric code",
      "sku",
      "item code",
      "design",
      "fabric no",
      "quality no",
      "quality code",
    ],
  },
  {
    key: "fabricName",
    label: "Fabric Name",
    required: true,
    synonyms: [
      "name",
      "fabric name",
      "item name",
      "description",
      "fabric",
      "item",
      "quality name",
    ],
  },
  {
    key: "gsm",
    label: "GSM",
    required: false,
    synonyms: ["gsm", "density", "weight", "g/sm"],
  },
  {
    key: "width",
    label: "Width",
    required: false,
    synonyms: [
      "width",
      "dia",
      "size",
      "width (inches)",
      "width (dia)",
      "inches",
    ],
  },
  {
    key: "color",
    label: "Color",
    required: false,
    synonyms: ["color", "colour", "shade", "hue", "shade no", "color code"],
  },
  {
    key: "quantity",
    label: "Quantity",
    required: true,
    synonyms: ["quantity", "qty", "meters", "roll", "rolls", "mtrs", "volume"],
  },
  {
    key: "unit",
    label: "Unit",
    required: false,
    synonyms: ["unit", "uom", "mtr", "meters", "pcs"],
  },
  {
    key: "rate",
    label: "Rate",
    required: true,
    synonyms: ["rate", "price", "cost", "unit price", "rate per mtr"],
  },
  {
    key: "amount",
    label: "Amount",
    required: false,
    synonyms: ["amount", "value", "subtotal", "total price", "basic amount"],
  },
  {
    key: "tax",
    label: "Tax (GST)",
    required: false,
    synonyms: [
      "tax",
      "gst",
      "cgst",
      "sgst",
      "igst",
      "tax amount",
      "vat",
      "gst amount",
    ],
  },
  {
    key: "totalAmount",
    label: "Total Amount",
    required: false,
    synonyms: [
      "total amount",
      "grand total",
      "invoice total",
      "total",
      "bill amount",
      "net amount",
    ],
  },
];

export const PTImporter = ({
  products,
  setProducts,
  suppliers,
  setSuppliers,
  purchaseOrders,
  onAddPurchaseOrder,
  onAddNotification,
  onClose,
}) => {
  // Wizard steps: 'upload' | 'mapping' | 'preview' | 'success'
  const [step, setStep] = useState("upload");
  // File data states
  const [fileName, setFileName] = useState("");
  const [excelHeaders, setExcelHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Column mapping: ERP Field Key -> Excel Column Index
  const [columnMapping, setColumnMapping] = useState({});

  // Parsed spreadsheet rows in preview state
  const [parsedRows, setParsedRows] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);
  const [editingData, setEditingData] = useState(null);

  // Success summary details
  const [createdVoucher, setCreatedVoucher] = useState(null);

  // Import statistics
  const importStats = useMemo(() => {
    let total = parsedRows.length;
    let success = parsedRows.filter((r) => r.status === "valid").length;
    let warning = parsedRows.filter((r) => r.status === "warning").length;
    let error = parsedRows.filter((r) => r.status === "error").length;
    let duplicates = parsedRows.filter((r) =>
      r.errors.some((e) => e.includes("Duplicate Invoice")),
    ).length;
    return {
      total,
      success,
      warning,
      error,
      duplicates,
    };
  }, [parsedRows]);

  // Handle Drag Over
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle Drop File
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Handle File Input Select
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Trigger File Upload Progress & Parse using SheetJS
  const processFile = (file) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      onAddNotification(
        "Invalid File",
        "Please upload a valid Excel file (.xlsx or .xls)",
        "danger",
      );
      return;
    }

    setFileName(file.name);
    setIsUploading(true);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 150);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // Read as raw arrays of strings/numbers
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (rows.length === 0) {
          clearInterval(interval);
          setIsUploading(false);
          onAddNotification(
            "Empty File",
            "The uploaded Excel file contains no data.",
            "danger",
          );
          return;
        }

        const headers = (rows[0] || []).map((h) => String(h).trim());
        const dataRows = rows
          .slice(1)
          .filter(
            (r) =>
              r.length > 0 &&
              r.some(
                (cell) => cell !== null && cell !== undefined && cell !== "",
              ),
          );

        setExcelHeaders(headers);
        setRawRows(dataRows);

        // Perform Smart Column Auto-Mapping
        const initialMapping = {};
        FIELDS_TO_MAP.forEach((field) => {
          // Look for direct match
          let matchIdx = headers.findIndex(
            (h) =>
              h.toLowerCase() === field.key.toLowerCase() ||
              h.toLowerCase() === field.label.toLowerCase(),
          );
          // Look for synonym matches
          if (matchIdx === -1) {
            matchIdx = headers.findIndex((h) =>
              field.synonyms.some(
                (syn) =>
                  h.toLowerCase() === syn.toLowerCase() ||
                  h.toLowerCase().includes(syn.toLowerCase()),
              ),
            );
          }

          if (matchIdx !== -1) {
            initialMapping[field.key] = matchIdx;
          }
        });

        setColumnMapping(initialMapping);
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setStep("mapping");
          onAddNotification(
            "Success",
            "Excel parsed. Review column mappings.",
            "success",
          );
        }, 500);
      } catch (err) {
        clearInterval(interval);
        setIsUploading(false);
        onAddNotification(
          "Parsing Failed",
          "Error parsing Excel spreadsheet content.",
          "danger",
        );
        console.error(err);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Skip step or confirm Mapping -> Generate Preview Rowset
  const handleConfirmMapping = () => {
    // Check if required fields are mapped
    const unmappedRequired = FIELDS_TO_MAP.filter(
      (f) => f.required && columnMapping[f.key] === undefined,
    );
    if (unmappedRequired.length > 0) {
      onAddNotification(
        "Mapping Required",
        `Please map required fields: ${unmappedRequired.map((f) => f.label).join(", ")}`,
        "warning",
      );
      return;
    }

    // Convert rawRows into structured ParsedRows
    const parsed = rawRows.map((rawRow, idx) => {
      const getVal = (key) => {
        const colIdx = columnMapping[key];
        if (colIdx === undefined) return "";
        const val = rawRow[colIdx];
        return val === undefined || val === null ? "" : String(val).trim();
      };

      const getNum = (key) => {
        const colIdx = columnMapping[key];
        if (colIdx === undefined) return 0;
        const val = rawRow[colIdx];
        if (val === undefined || val === null) return 0;
        const parsedNum = parseFloat(String(val).replace(/[^0-9.-]/g, ""));
        return isNaN(parsedNum) ? 0 : parsedNum;
      };

      const vendorName = getVal("vendorName");
      const invoiceNo = getVal("invoiceNo");
      const invoiceDate =
        getVal("invoiceDate") || new Date().toISOString().split("T")[0];
      const fabricCode = getVal("fabricCode");
      const fabricName = getVal("fabricName");
      const gsm = getNum("gsm");
      const width = getNum("width");
      const color = getVal("color") || "Raw Uncolored";
      const quantity = getNum("quantity");
      const unit = getVal("unit") || "Meters";
      const rate = getNum("rate");

      // Auto calculates
      const amount = getNum("amount") || quantity * rate;
      const tax = getNum("tax") || Math.round(amount * 0.12); // Fallback to 12% default GST
      const totalAmount = getNum("totalAmount") || amount + tax;

      return {
        tempId: `row-${idx}-${Date.now()}`,
        vendorName,
        invoiceNo,
        invoiceDate,
        fabricCode,
        fabricName,
        gsm,
        width,
        color,
        quantity,
        unit,
        rate,
        amount,
        tax,
        totalAmount,
        errors: [],
        warnings: [],
        status: "valid",
        resolution: "none",
      };
    });

    // Run validatons on the rows
    validateRows(parsed);
    setStep("preview");
  };

  // Re-run validation on rows
  const validateRows = (rowsToValidate) => {
    const validated = rowsToValidate.map((row) => {
      const errors = [];
      const warnings = [];

      // Required field checks
      if (!row.vendorName) errors.push("Vendor Name is missing");
      if (!row.invoiceNo) errors.push("Invoice Number is missing");
      if (!row.fabricCode) errors.push("Fabric Code is missing");
      if (!row.fabricName) errors.push("Fabric Name is missing");
      if (row.quantity <= 0) errors.push("Quantity must be greater than 0");
      if (row.rate <= 0) errors.push("Rate must be greater than 0");

      // Check duplicate invoice in ERP DB
      const duplicateInDB = purchaseOrders.some(
        (po) => po.invoiceNo?.toLowerCase() === row.invoiceNo.toLowerCase(),
      );
      if (duplicateInDB) {
        errors.push(`Duplicate Invoice Number in database (${row.invoiceNo})`);
      }

      // Check if duplicate in uploaded sheet itself (same invoice number but different vendor or rows)
      const duplicateInSheet = rowsToValidate.filter(
        (r) =>
          r.tempId !== row.tempId &&
          r.invoiceNo.toLowerCase() === row.invoiceNo.toLowerCase(),
      );
      if (
        duplicateInSheet.length > 0 &&
        duplicateInSheet[0].vendorName.toLowerCase() !==
          row.vendorName.toLowerCase()
      ) {
        errors.push(
          `Multiple vendors specified for same Invoice No (${row.invoiceNo})`,
        );
      }

      // Check if fabric code already exists in Fabric Master (products list)
      const fabricInMaster = products.find(
        (p) =>
          p.sku.toLowerCase() === row.fabricCode.toLowerCase() ||
          p.id.toLowerCase() === row.fabricCode.toLowerCase(),
      );
      let resolution = row.resolution;
      let mappedProductId = row.mappedProductId;

      if (!fabricInMaster) {
        warnings.push(
          `Fabric Code "${row.fabricCode}" not found in Fabric Master`,
        );
        if (resolution === "none") {
          resolution = "create"; // Default resolution to create new fabric automatically
        }
      } else {
        mappedProductId = fabricInMaster.id;
      }

      // Check if Supplier is registered in Wholesale suppliers
      const supplierInDB = suppliers.find(
        (s) => s.name.toLowerCase() === row.vendorName.toLowerCase(),
      );
      if (!supplierInDB) {
        warnings.push(
          `Supplier "${row.vendorName}" is not registered (will be registered automatically)`,
        );
      }

      let status = "valid";
      if (errors.length > 0) {
        status = "error";
      } else if (warnings.length > 0) {
        status = "warning";
      }

      return {
        ...row,
        errors,
        warnings,
        status,
        resolution,
        mappedProductId,
      };
    });

    setParsedRows(validated);
  };

  // Handle Edit row inline
  const handleStartEdit = (row) => {
    setEditingRowId(row.tempId);
    setEditingData({ ...row });
  };

  const handleSaveRowEdit = () => {
    if (!editingData) return;
    // Recalculate item totals upon saving edits
    const amount = editingData.quantity * editingData.rate;
    const tax = Math.round(amount * 0.12);
    const totalAmount = amount + tax;

    const updated = parsedRows.map((r) =>
      r.tempId === editingRowId
        ? {
            ...editingData,
            amount,
            tax,
            totalAmount,
          }
        : r,
    );
    validateRows(updated);
    setEditingRowId(null);
    setEditingData(null);
    onAddNotification(
      "Row Updated",
      "Spreadsheet row details edited and re-validated.",
      "success",
    );
  };

  // Bulk Resolve unmatched fabrics
  const handleSetBulkResolution = (resolution, mappedProductId) => {
    const updated = parsedRows.map((row) => {
      const fabricInMaster = products.find(
        (p) => p.sku.toLowerCase() === row.fabricCode.toLowerCase(),
      );
      if (!fabricInMaster) {
        return {
          ...row,
          resolution,
          mappedProductId: mappedProductId || row.mappedProductId,
        };
      }
      return row;
    });
    validateRows(updated);
  };

  // Change individual resolution
  const handleRowResolutionChange = (tempId, resolution, mappedId) => {
    const updated = parsedRows.map((r) => {
      if (r.tempId === tempId) {
        return {
          ...r,
          resolution,
          mappedProductId: mappedId || r.mappedProductId,
        };
      }
      return r;
    });
    validateRows(updated);
  };

  // Delete row from import list
  const handleDeleteRow = (tempId) => {
    const updated = parsedRows.filter((r) => r.tempId !== tempId);
    validateRows(updated);
    onAddNotification(
      "Row Excluded",
      "Excluded row from imported batch list.",
      "info",
    );
  };

  // Create Purchase Voucher Transaction & Unique Lot ID generation
  const handleImportPTFileSubmit = () => {
    // 1. Double check error count
    if (importStats.error > 0) {
      onAddNotification(
        "Import Blocked",
        "Please resolve or delete rows with validation errors first.",
        "danger",
      );
      return;
    }

    if (parsedRows.length === 0) {
      onAddNotification(
        "Empty List",
        "No valid rows available to import.",
        "warning",
      );
      return;
    }

    // 2. Automatically Register New Suppliers if any doesn't exist
    let currentSuppliers = [...suppliers];
    const uniqueVendorsInImport = Array.from(
      new Set(parsedRows.map((r) => r.vendorName)),
    );
    uniqueVendorsInImport.forEach((vendor) => {
      const exists = currentSuppliers.some(
        (s) => s.name.toLowerCase() === vendor.toLowerCase(),
      );
      if (!exists) {
        const newSup = {
          id: `sup-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: vendor,
          contactPerson: "PT Imported Contact",
          phone: "+91 99999 88888",
          email: `${vendor.toLowerCase().replace(/[^a-z0-9]/g, "")}@vendor.com`,
          gstin: `27AABC${Math.floor(1000 + Math.random() * 9000)}D1Z${Math.floor(Math.random() * 9)}`,
          outstandingBalance: 0,
          paymentHistory: [],
          totalOrders: 0,
          status: "Active",
        };
        currentSuppliers.push(newSup);
      }
    });

    // 3. Automatically Create New Fabric SKU in Master (Products)
    let currentProducts = [...products];
    parsedRows.forEach((row) => {
      if (row.resolution === "create") {
        const alreadyExists = currentProducts.some(
          (p) => p.sku.toLowerCase() === row.fabricCode.toLowerCase(),
        );
        if (!alreadyExists) {
          const newFabricProd = {
            id: `prod-pt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: row.fabricName,
            category: "Fabrics & Textiles",
            brand: "In-House PT Import",
            sku: row.fabricCode,
            barcode: `PT${Math.floor(10000000 + Math.random() * 90000000)}`,
            color: row.color,
            size: "M", // default standard size
            purchasePrice: row.rate,
            sellingPrice: Math.round(row.rate * 1.5),
            mrp: Math.round(row.rate * 1.8),
            gstPercent: 12,
            stock: 0, // initially zero, will be updated via the PO completion
            minStockAlert: 200,
            status: "In Stock",
            description: `Auto-created Fabric from PT Import. GSM: ${row.gsm || "N/A"}, Width: ${row.width || "N/A"}"`,
          };
          currentProducts.push(newFabricProd);
        }
      }
    });

    // Update global state with any newly created suppliers and products
    setSuppliers(currentSuppliers);
    setProducts(currentProducts);

    // 4. Group imported items by Vendor & Invoice Number to support multi-invoice files!
    // Often PT files contain items belonging to different invoices. We'll split them and create separate Purchase Orders.
    // However, to make things extremely streamlined and matching standard practices, we can create individual POs for each unique Invoice Number.
    const uniqueInvoiceNumbers = Array.from(
      new Set(parsedRows.map((r) => r.invoiceNo)),
    );
    let generatedPOs = [];

    uniqueInvoiceNumbers.forEach((invoiceNum) => {
      const invoiceRows = parsedRows.filter((r) => r.invoiceNo === invoiceNum);
      const representativeRow = invoiceRows[0];
      const subTotal = invoiceRows.reduce((sum, r) => sum + r.amount, 0);
      const gstTotal = invoiceRows.reduce((sum, r) => sum + r.tax, 0);
      const grandTotal = invoiceRows.reduce((sum, r) => sum + r.totalAmount, 0);

      // Find matched supplier
      const matchedSupObj =
        currentSuppliers.find(
          (s) =>
            s.name.toLowerCase() === representativeRow.vendorName.toLowerCase(),
        ) || currentSuppliers[0];

      // Build Items with unique Lot ID generation
      const items = invoiceRows.map((r, itemIdx) => {
        // Find mapped productId in refreshed products list
        const prodObj = currentProducts.find(
          (p) => p.sku.toLowerCase() === r.fabricCode.toLowerCase(),
        );
        const productId = prodObj ? prodObj.id : `prod-pt-${Date.now()}`;
        // Industry-standard automatic Lot ID generation: LOT-FABRICCODE-[InvoiceSuffix]-[RandomNum]
        const lotId = `LOT-${r.fabricCode.toUpperCase()}-${r.invoiceNo.slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;
        r.generatedLotId = lotId; // For visualization on success

        return {
          productId,
          name: `${r.fabricName} (GSM: ${r.gsm || "N/A"}, W: ${r.width || "N/A"}", C: ${r.color})`,
          quantity: r.quantity,
          purchasePrice: r.rate,
          totalPrice: r.amount,
          fabricCode: r.fabricCode,
          gsm: r.gsm,
          width: r.width,
          color: r.color,
          unit: r.unit,
          taxPercent: 12,
          taxAmount: r.tax,
          lotId,
        };
      });

      const newPO = {
        id: `po-pt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        poNo: `PV-PT-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`,
        date: representativeRow.invoiceDate,
        supplierId: matchedSupObj.id,
        supplierName: matchedSupObj.name,
        invoiceNo: invoiceNum,
        invoiceDate: representativeRow.invoiceDate,
        items,
        subTotal,
        gstTotal,
        grandTotal,
        status: "Completed", // Fulfilled immediately which updates stock
        outstandingPaid: 0,
        isImported: true,
        importSummary: {
          totalRows: invoiceRows.length,
          successRows: invoiceRows.length,
          failedRows: 0,
          duplicateRows: 0,
        },
      };

      onAddPurchaseOrder(newPO);
      generatedPOs.push(newPO);
    });

    // We can select the first generated PO as the featured Purchase Voucher for the Document Generator preview.
    setCreatedVoucher(generatedPOs[0]);
    setStep("success");
    // Add toast notifications
    onAddNotification(
      "PT Import Completed",
      `Successfully compiled and saved ${uniqueInvoiceNumbers.length} Purchase Vouchers. Generated ${parsedRows.length} unique Lot IDs in Stock.`,
      "success",
    );
  };

  // Receipt HTML Downloader matching existing Document Generation system
  const handleDownloadVoucherHTML = () => {
    if (!createdVoucher) return;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Purchase Voucher ${createdVoucher.poNo}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #334155;
      margin: 0;
      padding: 30px;
      line-height: 1.5;
      background: #ffffff;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      padding: 30px;
      border-radius: 12px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .logo-area h1 {
      margin: 0;
      font-size: 24px;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .logo-area p {
      margin: 2px 0 0 0;
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: bold;
    }
    .doc-meta {
      text-align: right;
    }
    .doc-meta h2 {
      margin: 0;
      font-size: 18px;
      color: #4f46e5;
    }
    .doc-meta p {
      margin: 4px 0 0 0;
      font-size: 12px;
      color: #64748b;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
      font-size: 12px;
    }
    .details-grid h3 {
      margin: 0 0 8px 0;
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .details-grid p {
      margin: 2px 0;
    }
    .party-card {
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #f1f5f9;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 12px;
    }
    th {
      background: #f8fafc;
      color: #64748b;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
      text-align: left;
      padding: 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    td {
      padding: 12px 10px;
      border-bottom: 1px solid #f1f5f9;
    }
    .text-right {
      text-align: right;
    }
    .summary-section {
      display: flex;
      justify-content: flex-end;
      font-size: 13px;
    }
    .summary-box {
      width: 250px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .summary-row.total {
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      font-weight: bold;
      color: #0f172a;
      font-size: 15px;
    }
    .footer {
      margin-top: 50px;
      border-top: 1px solid #f1f5f9;
      padding-top: 20px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      background: #f1f5f9;
      border-radius: 4px;
      font-size: 10px;
      font-family: monospace;
      font-weight: bold;
    }
    .badge.lot {
      background: #eef2ff;
      color: #4f46e5;
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div class="logo-area">
        <h1>GARMENT ERP SYSTEMS</h1>
        <p>Supply Chain Logistics & Procurement Ledger</p>
      </div>
      <div class="doc-meta">
        <h2>PURCHASE VOUCHER</h2>
        <p>Voucher # <strong>${createdVoucher.poNo}</strong></p>
        <p>Date: ${createdVoucher.date}</p>
      </div>
    </div>

    <div class="details-grid">
      <div class="party-card">
        <h3>Wholesale Supplier Details</h3>
        <p><strong>${createdVoucher.supplierName}</strong></p>
        <p>Logistics Ledger Account: Active</p>
        <p>Receipt Status: Saved & Verified</p>
      </div>
      <div class="party-card">
        <h3>Import Metadata</h3>
        <p>Vendor Invoice Ref: <strong>${createdVoucher.invoiceNo || "N/A"}</strong></p>
        <p>Vendor Invoice Date: ${createdVoucher.invoiceDate || "N/A"}</p>
        <p>Unique Lots Generated: ${createdVoucher.items.length} lots</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>S.No</th>
          <th>Fabric Item Description</th>
          <th>Lot Tracker ID</th>
          <th class="text-right">Quantity</th>
          <th class="text-right">Import Rate</th>
          <th class="text-right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${createdVoucher.items
          .map(
            (item, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>
              <strong>${item.name}</strong><br/>
              <span style="font-size: 10px; color:#64748b;">Code: ${item.fabricCode || "N/A"} | Color: ${item.color || "N/A"} | GSM: ${item.gsm || "N/A"} | Width: ${item.width || "N/A"}"</span>
            </td>
            <td><span class="badge lot">${item.lotId || "N/A"}</span></td>
            <td class="text-right">${item.quantity.toLocaleString()} ${item.unit || "Mtr"}</td>
            <td class="text-right">₹${item.purchasePrice.toLocaleString()}</td>
            <td class="text-right">₹${item.totalPrice.toLocaleString()}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>

    <div class="summary-section">
      <div class="summary-box">
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>₹${createdVoucher.subTotal.toLocaleString()}</span>
        </div>
        <div class="summary-row">
          <span>GST / Taxes (12%):</span>
          <span>₹${createdVoucher.gstTotal.toLocaleString()}</span>
        </div>
        <div class="summary-row total">
          <span>Grand Total:</span>
          <span>₹${createdVoucher.grandTotal.toLocaleString()}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>This is a system-generated document generated after processing PT (Purchase Template) Vendor Excel files.</p>
      <p>All stock lots have been created and queued in Warehouse systems. Inventory balances updated.</p>
    </div>
  </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `purchase_voucher_${createdVoucher.poNo}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onAddNotification(
      "Voucher Downloader",
      `Purchase Voucher HTML ${createdVoucher.poNo} downloaded.`,
      "success",
    );
  };

  // Trigger window print for document
  const handlePrintVoucher = () => {
    window.print();
  };

  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      id="pt-import-system-root"
    >
      {/* HEADER BAR */}
      <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider font-mono">
              Procurement Tools
            </span>
            <h2 className="text-base font-bold">
              PT (Purchase Template) File Import System
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* STEP WIZARD PILLS */}
          <div className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase font-mono bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-700">
            <span
              className={
                step === "upload" ? "text-indigo-400" : "text-slate-400"
              }
            >
              1. Upload
            </span>
            <ChevronRight className="w-2.5 h-2.5 text-slate-500" />
            <span
              className={
                step === "mapping" ? "text-indigo-400" : "text-slate-400"
              }
            >
              2. Map Columns
            </span>
            <ChevronRight className="w-2.5 h-2.5 text-slate-500" />
            <span
              className={
                step === "preview" ? "text-indigo-400" : "text-slate-400"
              }
            >
              3. Verify & Edit
            </span>
            <ChevronRight className="w-2.5 h-2.5 text-slate-500" />
            <span
              className={
                step === "success"
                  ? "text-emerald-400 font-extrabold"
                  : "text-slate-400"
              }
            >
              4. Generated
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1: UPLOAD ZONE */}
      {step === "upload" && (
        <div className="p-8 space-y-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Upload Supplier Purchase Template
              </h3>
              <p className="text-xs text-slate-400">
                Directly parse bulk sheets from Aura, Vardhman, Arvind, or other
                suppliers. The system auto-resolves material masters.
              </p>
            </div>

            {/* DRAG AND DROP ZONE */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-10 text-center space-y-4 cursor-pointer transition-all bg-slate-50/50 hover:bg-slate-50"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx,.xls"
              />

              <div className="w-12 h-12 bg-white rounded-xl shadow-xs border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <UploadCloud className="w-6 h-6 text-slate-500 animate-bounce" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-600">
                  Drag & drop vendor PT spreadsheet here, or{" "}
                  <span className="text-indigo-600 hover:underline">
                    browse files
                  </span>
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Supports .XLSX and .XLS file types
                </p>
              </div>
            </div>

            {/* UPLOADING STATE */}
            {isUploading && (
              <div className="space-y-2 animate-fade-in">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-500 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />{" "}
                    Reading Worksheet Matrix...
                  </span>
                  <span className="font-bold text-slate-700">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* REFERENCE TEMPLATE GUIDE */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs space-y-3.5">
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Industry-Standard PT Column Mapping Guide</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                The import wizard automatically looks for and processes the
                following columns. It supports synonyms and performs fuzzy
                matching on columns:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-[10px]">
                <div className="p-2 bg-white rounded-lg border border-slate-100">
                  <span className="text-indigo-600 font-bold">•</span> Vendor
                  Name (Vendor)
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-100">
                  <span className="text-indigo-600 font-bold">•</span> Invoice
                  Number (Bill)
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-100">
                  <span className="text-indigo-600 font-bold">•</span> Fabric
                  Code (SKU)
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-100">
                  <span className="text-indigo-600 font-bold">•</span> Fabric
                  Name (Desc)
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-100">
                  <span className="text-indigo-600 font-bold">•</span> GSM
                  (Density)
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-100">
                  <span className="text-indigo-600 font-bold">•</span> Width
                  (Dia)
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-100">
                  <span className="text-indigo-600 font-bold">•</span> Color /
                  Shade
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-100">
                  <span className="text-indigo-600 font-bold">•</span> Quantity
                  (Meters)
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-100">
                  <span className="text-indigo-600 font-bold">•</span> Rate
                  (Price)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: COLUMN MAPPING DIALOG */}
      {step === "mapping" && (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Fuzzy Column Alignment Map
              </h3>
              <p className="text-xs text-slate-400">
                Verify how Excel columns map to Garment ERP fields. Select
                columns manually if needed.
              </p>
            </div>
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-mono font-bold">
              {fileName}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* COLUMN SELECTOR MATRIX */}
            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2">
              {FIELDS_TO_MAP.map((field) => {
                const mappedColIdx = columnMapping[field.key];
                const isMapped = mappedColIdx !== undefined;

                return (
                  <div
                    key={field.key}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      isMapped
                        ? "bg-indigo-50/40 border-indigo-100 hover:border-indigo-200"
                        : field.required
                          ? "bg-rose-50/30 border-rose-100 hover:border-rose-200"
                          : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700">
                          {field.label}
                        </span>
                        {field.required && (
                          <span className="text-rose-500 font-extrabold">
                            *
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Mapped to Excel header
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={
                          mappedColIdx === undefined ? "" : String(mappedColIdx)
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setColumnMapping((prev) => {
                            const copy = { ...prev };
                            if (val === "") {
                              delete copy[field.key];
                            } else {
                              copy[field.key] = parseInt(val);
                            }
                            return copy;
                          });
                        }}
                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 shadow-xs outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Ignore Field --</option>
                        {excelHeaders.map((header, idx) => (
                          <option key={idx} value={String(idx)}>
                            Col {idx + 1}: {header}
                          </option>
                        ))}
                      </select>
                      {isMapped ? (
                        <span
                          className="bg-emerald-100 text-emerald-800 p-1.5 rounded-full"
                          title="Mapped Successfully"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        field.required && (
                          <span
                            className="bg-rose-100 text-rose-800 p-1.5 rounded-full"
                            title="Required Field Unmapped"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          </span>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PREVIEW BOX */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4 text-xs">
              <h4 className="font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-indigo-500" /> Initial Raw Excel
                Headings Mapping
              </h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Below is a sample of headings found on your spreadsheet row 1.
                Double check mapping is correct before generating editable
                voucher lines.
              </p>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {excelHeaders.map((header, idx) => {
                  // Find if mapped
                  const mappedField = FIELDS_TO_MAP.find(
                    (f) => columnMapping[f.key] === idx,
                  );
                  return (
                    <div
                      key={idx}
                      className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between font-mono text-[11px]"
                    >
                      <div>
                        <span className="text-slate-400 mr-2">
                          Col {idx + 1}:
                        </span>
                        <span className="font-bold text-slate-700">
                          {header}
                        </span>
                      </div>
                      {mappedField ? (
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                          {mappedField.label}
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                          Skipped
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-200">
                <button
                  onClick={() => setStep("upload")}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Back to Upload
                </button>
                <button
                  onClick={handleConfirmMapping}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  Generate Spreadsheet Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW SPREADSHEET TABLE */}
      {step === "preview" && (
        <div className="p-6 space-y-6">
          {/* STATS PANEL AND RESOLUTIONS TOOLBAR */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* STATS CHIPS */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between text-xs shadow-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wide block">
                  Import Lines
                </span>
                <span className="text-xl font-black text-slate-800">
                  {importStats.total} rows
                </span>
              </div>
              <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-xl">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl flex items-center justify-between text-xs shadow-xs">
              <div>
                <span className="text-emerald-500 font-bold uppercase tracking-wide block">
                  Ready to Import
                </span>
                <span className="text-xl font-black text-emerald-700">
                  {importStats.success} rows
                </span>
              </div>
              <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-amber-50/40 border border-amber-100 p-4 rounded-xl flex items-center justify-between text-xs shadow-xs">
              <div>
                <span className="text-amber-500 font-bold uppercase tracking-wide block">
                  Fabric Warnings
                </span>
                <span className="text-xl font-black text-amber-700">
                  {importStats.warning} rows
                </span>
              </div>
              <div className="bg-amber-100 text-amber-600 p-2.5 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-rose-50/40 border border-rose-100 p-4 rounded-xl flex items-center justify-between text-xs shadow-xs">
              <div>
                <span className="text-rose-500 font-bold uppercase tracking-wide block">
                  Validation Errors
                </span>
                <span className="text-xl font-black text-rose-700">
                  {importStats.error} rows
                </span>
              </div>
              <div className="bg-rose-100 text-rose-600 p-2.5 rounded-xl">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* BULK MASTER RESOLUTIONS ACCORDION */}
          {importStats.warning > 0 && (
            <div className="bg-amber-50/60 border border-amber-200/50 rounded-xl p-4 text-xs space-y-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />
                <span>
                  Fabric Master Sync Warning: Fabric codes do not exist in
                  system database
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                You have imported fabric materials that do not exist in the
                Fabric Master. Choose how you want to handle these unmatched
                fabric codes:
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSetBulkResolution("create")}
                  className="px-3.5 py-1.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 cursor-pointer"
                >
                  Auto-create missing Fabric entries in Fabric Master
                </button>
                <button
                  onClick={() => handleSetBulkResolution("map")}
                  className="px-3.5 py-1.5 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-700 cursor-pointer"
                >
                  Link all manually to an existing catalog design SKU
                </button>
              </div>
            </div>
          )}

          {/* EDITABLE SPREADSHEET TABLE DESIGN */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Voucher spreadsheet verification lines
              </span>
              <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold">
                Spreadsheet Style
              </span>
            </div>

            <div className="overflow-x-auto max-h-[450px]">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wide select-none">
                    <th className="p-3 text-center border-r border-slate-200 w-10">
                      Row
                    </th>
                    <th className="p-3 border-r border-slate-200 min-w-[70px]">
                      Status
                    </th>
                    <th className="p-3 border-r border-slate-200 min-w-[120px]">
                      Vendor (Party)
                    </th>
                    <th className="p-3 border-r border-slate-200 font-mono min-w-[90px]">
                      Invoice No
                    </th>
                    <th className="p-3 border-r border-slate-200 font-mono min-w-[110px]">
                      Fabric SKU (Code)
                    </th>
                    <th className="p-3 border-r border-slate-200 min-w-[150px]">
                      Fabric Name
                    </th>
                    <th className="p-3 border-r border-slate-200 text-center w-14">
                      GSM
                    </th>
                    <th className="p-3 border-r border-slate-200 text-center w-14">
                      Width
                    </th>
                    <th className="p-3 border-r border-slate-200 min-w-[80px]">
                      Color
                    </th>
                    <th className="p-3 border-r border-slate-200 text-right min-w-[80px]">
                      Quantity
                    </th>
                    <th className="p-3 border-r border-slate-200 text-right min-w-[80px]">
                      Rate (₹)
                    </th>
                    <th className="p-3 border-r border-slate-200 text-right min-w-[90px]">
                      Total (Tax Incl)
                    </th>
                    <th className="p-3 min-w-[140px] text-center">
                      Unmatched Resolution
                    </th>
                    <th className="p-3 text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {parsedRows.map((row, idx) => {
                    const isEditing = editingRowId === row.tempId;

                    return (
                      <tr
                        key={row.tempId}
                        className={`hover:bg-slate-50/50 ${
                          row.status === "error"
                            ? "bg-rose-50/20"
                            : row.status === "warning"
                              ? "bg-amber-50/15"
                              : ""
                        }`}
                      >
                        {/* ROW INDEX */}
                        <td className="p-3 text-center border-r border-slate-100 font-mono text-slate-400">
                          {idx + 1}
                        </td>

                        {/* STATUS BADGE */}
                        <td className="p-3 border-r border-slate-100 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              row.status === "valid"
                                ? "bg-emerald-50 text-emerald-600"
                                : row.status === "warning"
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-rose-50 text-rose-600 animate-pulse"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>

                        {/* VENDOR */}
                        <td className="p-3 border-r border-slate-100">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingData?.vendorName || ""}
                              onChange={(e) =>
                                setEditingData((prev) =>
                                  prev
                                    ? { ...prev, vendorName: e.target.value }
                                    : null,
                                )
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1"
                            />
                          ) : (
                            <span className="font-semibold text-slate-800">
                              {row.vendorName}
                            </span>
                          )}
                        </td>

                        {/* INVOICE NO */}
                        <td className="p-3 border-r border-slate-100 font-mono">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingData?.invoiceNo || ""}
                              onChange={(e) =>
                                setEditingData((prev) =>
                                  prev
                                    ? { ...prev, invoiceNo: e.target.value }
                                    : null,
                                )
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 font-mono"
                            />
                          ) : (
                            row.invoiceNo
                          )}
                        </td>

                        {/* FABRIC SKU */}
                        <td className="p-3 border-r border-slate-100 font-mono font-bold text-slate-700">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingData?.fabricCode || ""}
                              onChange={(e) =>
                                setEditingData((prev) =>
                                  prev
                                    ? { ...prev, fabricCode: e.target.value }
                                    : null,
                                )
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 font-mono"
                            />
                          ) : (
                            row.fabricCode
                          )}
                        </td>

                        {/* FABRIC NAME */}
                        <td className="p-3 border-r border-slate-100">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingData?.fabricName || ""}
                              onChange={(e) =>
                                setEditingData((prev) =>
                                  prev
                                    ? { ...prev, fabricName: e.target.value }
                                    : null,
                                )
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1"
                            />
                          ) : (
                            row.fabricName
                          )}
                        </td>

                        {/* GSM */}
                        <td className="p-3 border-r border-slate-100 text-center font-mono">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editingData?.gsm || ""}
                              onChange={(e) =>
                                setEditingData((prev) =>
                                  prev
                                    ? { ...prev, gsm: Number(e.target.value) }
                                    : null,
                                )
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded px-1 py-1 font-mono text-center"
                            />
                          ) : (
                            row.gsm || <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* WIDTH */}
                        <td className="p-3 border-r border-slate-100 text-center font-mono">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editingData?.width || ""}
                              onChange={(e) =>
                                setEditingData((prev) =>
                                  prev
                                    ? { ...prev, width: Number(e.target.value) }
                                    : null,
                                )
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded px-1 py-1 font-mono text-center"
                            />
                          ) : row.width ? (
                            `${row.width}"`
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* COLOR */}
                        <td className="p-3 border-r border-slate-100">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingData?.color || ""}
                              onChange={(e) =>
                                setEditingData((prev) =>
                                  prev
                                    ? { ...prev, color: e.target.value }
                                    : null,
                                )
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1"
                            />
                          ) : (
                            row.color
                          )}
                        </td>

                        {/* QUANTITY */}
                        <td className="p-3 border-r border-slate-100 text-right font-mono font-bold text-slate-800">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editingData?.quantity || ""}
                              onChange={(e) =>
                                setEditingData((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        quantity: Number(e.target.value),
                                      }
                                    : null,
                                )
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-right font-mono"
                            />
                          ) : (
                            `${row.quantity.toLocaleString()} ${row.unit}`
                          )}
                        </td>

                        {/* RATE */}
                        <td className="p-3 border-r border-slate-100 text-right font-mono text-slate-700">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editingData?.rate || ""}
                              onChange={(e) =>
                                setEditingData((prev) =>
                                  prev
                                    ? { ...prev, rate: Number(e.target.value) }
                                    : null,
                                )
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-right font-mono"
                            />
                          ) : (
                            `₹${row.rate.toLocaleString()}`
                          )}
                        </td>

                        {/* TOTAL */}
                        <td className="p-3 border-r border-slate-100 text-right font-mono font-bold text-slate-900">
                          ₹{row.totalAmount.toLocaleString()}
                        </td>

                        {/* UNMATCHED RESOLUTION SELECTOR */}
                        <td className="p-3 border-r border-slate-100 text-center">
                          {products.some(
                            (p) =>
                              p.sku.toLowerCase() ===
                              row.fabricCode.toLowerCase(),
                          ) ? (
                            <span className="text-emerald-600 font-bold flex items-center justify-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Matched In DB
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5 justify-center">
                              <select
                                value={row.resolution}
                                onChange={(e) =>
                                  handleRowResolutionChange(
                                    row.tempId,
                                    e.target.value,
                                  )
                                }
                                className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-[10px] font-semibold text-slate-700"
                              >
                                <option value="create">
                                  Auto-Create Fabric
                                </option>
                                <option value="map">Map manually</option>
                              </select>

                              {row.resolution === "map" && (
                                <select
                                  value={row.mappedProductId || ""}
                                  onChange={(e) =>
                                    handleRowResolutionChange(
                                      row.tempId,
                                      "map",
                                      e.target.value,
                                    )
                                  }
                                  className="bg-slate-50 border border-indigo-200 rounded px-1.5 py-1 text-[10px] font-semibold text-indigo-700"
                                >
                                  <option value="">Select Fabric...</option>
                                  {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.sku} ({p.name})
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isEditing ? (
                              <button
                                onClick={handleSaveRowEdit}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white p-1 rounded cursor-pointer"
                                title="Save Row Changes"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartEdit(row)}
                                className="bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 text-slate-500 p-1 rounded cursor-pointer"
                                title="Edit Spreadsheet cell data"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteRow(row.tempId)}
                              className="bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-500 p-1 rounded cursor-pointer"
                              title="Delete/Exclude Row from Import"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ERROR SUMMARY BOX IF FAILED */}
            {parsedRows.some((r) => r.errors.length > 0) && (
              <div className="bg-rose-50 border-t border-rose-200 p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 text-rose-800 font-bold">
                  <XCircle className="w-4 h-4 text-rose-600 animate-pulse" />
                  <span>
                    Row Validation Failures: Resolve conflicts to continue
                    import
                  </span>
                </div>
                <div className="max-h-24 overflow-y-auto space-y-1.5 font-mono text-[10px] text-rose-700">
                  {parsedRows
                    .filter((r) => r.errors.length > 0)
                    .map((r, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="font-extrabold bg-rose-200 text-rose-800 px-1 rounded">
                          Row {i + 1}
                        </span>
                        <span>{r.errors.join(", ")}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep("mapping")}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
            >
              Back to Column Mapping
            </button>
            <button
              onClick={handleImportPTFileSubmit}
              disabled={importStats.error > 0 || parsedRows.length === 0}
              className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-md text-white ${
                importStats.error > 0 || parsedRows.length === 0
                  ? "bg-slate-300 cursor-not-allowed shadow-none"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Compile & Save Purchase Vouchers</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SUCCESS DOCUMENT GENERATION VIEWER */}
      {step === "success" && createdVoucher && (
        <div className="p-8 space-y-8 animate-fade-in text-xs max-w-4xl mx-auto">
          {/* SUCCESS ANIMATION AND CHIPS */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-3xl shadow-lg border-4 border-emerald-100 animate-bounce">
              ✓
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">
                Purchase Template Imported Successfully!
              </h3>
              <p className="text-slate-400">
                Unique stock lots have been created, fabric inventory loaded,
                and supply ledgers synced.
              </p>
            </div>
          </div>

          {/* COMPILATION SUMMARY DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-1.5 shadow-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wide block">
                Purchase Voucher Generated
              </span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {createdVoucher.poNo}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-1.5 shadow-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wide block">
                Vendor Invoice Reference
              </span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {createdVoucher.invoiceNo || "N/A"}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-1.5 shadow-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wide block">
                Grand Total Saved to Ledger
              </span>
              <span className="text-sm font-bold text-indigo-600 font-mono">
                ₹{createdVoucher.grandTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* SPREADSHEET LOT CODE REPORT */}
          <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-indigo-800 font-bold">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <span>Unique fabric lot trackers created</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-[10px] text-indigo-700">
              {createdVoucher.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-white border border-indigo-100 rounded-xl flex flex-col justify-between shadow-2xs"
                >
                  <span className="font-extrabold text-slate-800">
                    {item.name.split(" (")[0]}
                  </span>
                  <div className="flex justify-between items-center mt-1.5 pt-1 border-t border-slate-100">
                    <span className="text-slate-400">LOT CODE:</span>
                    <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold">
                      {item.lotId || "N/A"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* EXPORT VOUCHER DOCUMENT PREVIEW */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-700 uppercase tracking-wide">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Voucher Document Preview Layout</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadVoucherHTML}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download HTML Receipt</span>
                </button>
                <button
                  onClick={handlePrintVoucher}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>
              </div>
            </div>

            {/* PHYSICAL CARD DISPLAY */}
            <div className="bg-white border border-slate-200 p-8 rounded-xl max-w-3xl mx-auto space-y-6 shadow-xs font-sans text-slate-700 leading-normal">
              <div className="flex justify-between items-start border-b-2 border-slate-100 pb-4">
                <div>
                  <h4 className="text-slate-900 font-extrabold text-base tracking-tight uppercase">
                    Garment ERP Systems
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                    Wholesale Textile Procurement Loop
                  </p>
                </div>
                <div className="text-right">
                  <h4 className="text-indigo-600 font-bold tracking-tight uppercase">
                    Purchase Voucher
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">
                    VOUCHER:{" "}
                    <strong className="text-slate-800 font-bold">
                      {createdVoucher.poNo}
                    </strong>
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    DATE: {createdVoucher.date}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                    Wholesale Supplier Account
                  </h5>
                  <p className="font-extrabold text-slate-800">
                    {createdVoucher.supplierName}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Supply Chain Ledger Account: Updated & Settled
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                    PT File Metadata Summary
                  </h5>
                  <p className="font-mono text-slate-800">
                    Invoice Ref No:{" "}
                    <strong>{createdVoucher.invoiceNo || "N/A"}</strong>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Date Raised: {createdVoucher.invoiceDate || "N/A"}
                  </p>
                </div>
              </div>

              <table className="w-full text-left border-collapse mt-4 text-[11px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 tracking-wider">
                    <th className="p-2 w-10 text-center">#</th>
                    <th className="p-2">Fabric Item & Specifications</th>
                    <th className="p-2 text-center">Lot ID</th>
                    <th className="p-2 text-right">Quantity</th>
                    <th className="p-2 text-right">Import Rate</th>
                    <th className="p-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {createdVoucher.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="p-2.5">
                        <p className="font-bold text-slate-800">{item.name}</p>
                        <span className="text-[9px] text-slate-400">
                          SKU: {item.fabricCode} | Tax rate: 12% GST
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-mono font-bold">
                          {item.lotId}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-mono">
                        {item.quantity.toLocaleString()} {item.unit || "Mtr"}
                      </td>
                      <td className="p-2.5 text-right font-mono">
                        ₹{item.purchasePrice.toLocaleString()}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                        ₹{item.totalPrice.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <div className="w-64 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Taxable Subtotal:</span>
                    <span>₹{createdVoucher.subTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>GST (12%):</span>
                    <span>₹{createdVoucher.gstTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-dashed border-slate-200">
                    <span>Grand Total:</span>
                    <span>₹{createdVoucher.grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer shadow-md text-xs uppercase tracking-wider"
            >
              Return to Procurement Ledger
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
