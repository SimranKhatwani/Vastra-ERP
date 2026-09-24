import api from '../api/axios';
import React, { useState, useRef, useMemo } from "react";
import { UploadCloud, CheckCircle2, CheckCircle, XCircle, FileSpreadsheet, Edit3, Save, ArrowLeft, Printer, Download, AlertTriangle, RefreshCw, FileText, Check, ChevronRight, Eye, Trash2, ZoomIn, X } from "lucide-react";
import * as XLSX from "xlsx";
import { extractImagesFromExcel } from '../helpers/excelImageExtractor';

const FIELDS_TO_MAP = [
  { key: "serialNumber", label: "S.No.", required: false, synonyms: ["s.no.", "s.no", "sr no", "sr. no.", "serial", "sno", "serial number", "sl no", "sl. no.", "s. no.", "s. no"] },
  { key: "billNo", label: "Bill Number", required: true, synonyms: ["bill number", "bill no", "bill no.", "invoice no", "invoice no.", "invoice", "invoice number", "bill num", "bill"] },
  { key: "billDate", label: "Bill Date", required: true, synonyms: ["bill date", "date", "invoice date", "bill_date"] },
  { key: "vendorName", label: "Vendor Name", required: true, synonyms: ["vendor name", "vendor", "supplier", "party", "party name", "supplier name", "vendor_name"] },
  { key: "vendorGst", label: "Vendor GST", required: false, synonyms: ["vendor gst", "vendor gstin", "gstin", "gst no", "gst number", "party gst", "vendor_gst"] },
  { key: "vendorCode", label: "Vendor Code", required: false, synonyms: ["vendor code", "v code", "v. code", "party code", "supplier code", "vendor_code"] },
  { key: "brand", label: "Brand", required: false, synonyms: ["brand", "brand name", "make"] },
  { key: "ipn", label: "IPN", required: false, synonyms: ["ipn", "ipn no", "ipn no.", "ipn number"] },
  { key: "designNo", label: "Design No", required: true, synonyms: ["design no", "design no.", "design", "design number", "article", "art no", "art no."] },
  { key: "barcode", label: "Barcode No", required: false, synonyms: ["barcode no", "barcode no.", "barcode", "bar code", "bar code no", "barcode number"] },
  { key: "itemName", label: "Item Name", required: true, synonyms: ["item name", "item", "product", "product name", "category"] },
  { key: "subCategory", label: "Sub Item Name", required: false, synonyms: ["sub item name", "sub item", "sub category", "sub-category", "subitem", "sub item no"] },
  { key: "itemCode", label: "Item Code", required: false, synonyms: ["item code", "code", "sku", "product code"] },
  { key: "quantity", label: "Total Qty", required: true, synonyms: ["total qty.", "total qty", "qty", "qty.", "quantity", "pcs", "total quantity"] },
  { key: "batch", label: "Batch", required: false, synonyms: ["batch", "batch no", "batch no.", "batch number", "lot", "lot no", "lot number", "lot no."] },
  { key: "counter", label: "Counter", required: false, synonyms: ["counter", "counter no", "counter no.", "counter number", "counter name", "cntr", "cntr no", "cntr no.", "counter_no", "counter code"] },
  { key: "topBottomSet", label: "Group 1 (Top/Bottom/Set)", required: false, synonyms: ["group 1 (top/bottom/set)", "group 1(top/bottom/set)", "group 1", "group1", "top/bottom/set", "top bottom set", "set type", "group", "type"] },
  { key: "gender", label: "Gender", required: false, synonyms: ["gender", "sex", "category gender"] },
  { key: "colorPrimary", label: "Color (P)", required: false, synonyms: ["color (p)", "color(p)", "colour (p)", "colour(p)", "primary color", "primary colour", "color", "colour", "shade", "shade no", "shade no.", "col", "clr", "colour name", "color name", "color_p", "colour_p"] },
  { key: "colorSecondary", label: "Color (S)", required: false, synonyms: ["color (s)", "color(s)", "colour (s)", "colour(s)", "secondary color", "secondary colour", "color_s", "colour_s"] },
  { key: "size", label: "Size", required: false, synonyms: ["size", "sizes", "sz"] },
  { key: "purchaseRate", label: "P. Rate", required: true, synonyms: ["p. rate", "p.rate", "p rate", "p_rate", "purchase rate", "rate", "purchase price", "buy price", "cost price"] },
  { key: "gstOnPurchase", label: "GST on Purchase", required: false, synonyms: ["gst on purchase", "gst", "tax", "tax rate", "gst %", "tax %", "gst rate"] },
  { key: "typeOfGst", label: "Type of GST (I/L)", required: false, synonyms: ["type of gst (i/l)", "type of gst (i/e)", "type of gst", "gst type", "gst i/e", "gst i/l", "type of gst (i/l/e)"] },
  { key: "gstStatus", label: "GST Status", required: false, synonyms: ["gst status", "tax status", "gst_status"] },
  { key: "wspAfterGst", label: "WSP After GST", required: false, synonyms: ["wsp after gst", "after gst", "after tax", "rate after gst", "p. rate after gst", "p.rate after gst", "purchase rate after gst", "cost after gst", "wsp", "wsp (after gst)", "wsp(after gst)", "final rate", "landing cost", "landed cost", "net rate"] },
  { key: "mrp", label: "MRP", required: false, synonyms: ["mrp", "m.r.p.", "m.r.p", "retail price", "retail mrp", "selling price", "sale price", "sales price", "r. rate", "r.rate", "retail rate"] },
  { key: "gstOnSalePrice", label: "GST on Sale", required: false, synonyms: ["gst on sale", "gst on sale price", "sale gst", "gst on sale %"] },
  { key: "discountStatus", label: "Discount Status (B/A/N)", required: false, synonyms: ["discount status (b/a/n)", "discount status", "discount status(b/a/n)", "discount status (b/a/n/)", "discount status(b/a/n/)", "discount status (b/n/a)", "discount_status", "disc_status", "disc status", "disc. status", "discount type", "disc type", "discount mode"] },
  { key: "discountOnPurchase", label: "Dis. on Purchase", required: false, synonyms: ["dis. on purchase", "discount on purchase", "dis on purchase", "discount", "disc", "dis."] },
  { key: "hsnCode", label: "HSN Code", required: false, synonyms: ["hsn code", "hsn", "sac code", "hsn no", "hsn no.", "hsn number", "hsn/sac"] },
  { key: "firm", label: "Firm", required: false, synonyms: ["firm", "company", "firm name"] },
  { key: "transport", label: "Transport", required: false, synonyms: ["transport", "transporter", "transport name", "vehicle no", "transport mode"] },
  { key: "irnNo", label: "IRN No", required: false, synonyms: ["irn no", "irn no.", "irn", "irn number", "e-invoice irn", "einvoice irn"] },
  { key: "state", label: "State", required: false, synonyms: ["state", "state name", "place of supply"] },
  { key: "stateCode", label: "State Code", required: false, synonyms: ["state code", "pos code"] },
  { key: "uniqueCode", label: "Unique Code", required: false, synonyms: ["unique code"] },
  { key: "itemImage", label: "Item Image", required: false, synonyms: ["item image", "image", "photo", "picture", "item photo", "design image"] }
];

const EDITABLE_COLUMNS = [
  'serialNumber',
  'billNo',
  'billDate',
  'vendorName',
  'vendorGst',
  'vendorCode',
  'brand',
  'ipn',
  'designNo',
  'barcode',
  'itemName',
  'subCategory',
  'itemCode',
  'quantity',
  'batch',
  'counter',
  'topBottomSet',
  'gender',
  'colorPrimary',
  'colorSecondary',
  'size',
  'purchaseRate',
  'gstOnPurchase',
  'typeOfGst',
  'gstStatus',
  'wspAfterGst',
  'mrp',
  'gstOnSalePrice',
  'discountStatus',
  'discountOnPurchase',
  'hsnCode',
  'firm',
  'uniqueCode'
];

const generateObjectId = () => Math.floor(Date.now() / 1000).toString(16) + 'x'.repeat(16).replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));

export const PTImporter = ({ products, setProducts, suppliers, setSuppliers, purchaseOrders, onAddPurchaseOrder, onAddNotification, onClose }) => {
  const [step, setStep] = useState("upload");
  const [rawRows, setRawRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [globalValues, setGlobalValues] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [vendorDataRows, setVendorDataRows] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importLoaderMessage, setImportLoaderMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [createdVoucher, setCreatedVoucher] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const invoiceRef = useRef(null);

  const processFile = async (file) => {
    setIsUploading(true);
    setUploadProgress(10);

    let extractedImages = {};
    try {
      extractedImages = await extractImagesFromExcel(file);
    } catch (err) {
      console.warn("Could not extract embedded Excel images:", err);
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        setUploadProgress(50);
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (data.length < 2) throw new Error("Spreadsheet appears empty or has no data rows.");

        // Extract Vendor Data from all subsequent sheets (Sheet 2, Sheet 3, etc.)
        let allVendorData = [];
        for (let i = 1; i < wb.SheetNames.length; i++) {
          const vSheet = wb.Sheets[wb.SheetNames[i]];
          const vData = XLSX.utils.sheet_to_json(vSheet, { defval: "" });
          allVendorData = allVendorData.concat(vData);
        }
        setVendorDataRows(allVendorData);

        const hdrs = data[0].map(h => String(h || "").trim());
        setHeaders(hdrs);
        const rows = data.slice(1).filter(r => r.some(cell => cell !== undefined && cell !== ""));
        setRawRows(rows);
        let initialMapping = {};
        const usedCols = new Set(); // prevent double-mapping

        const cleanStr = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

        // Pass 1: Exact match on field key or label or sanitized match
        FIELDS_TO_MAP.forEach(field => {
          const matchIdx = hdrs.findIndex((h, i) => !usedCols.has(i) && (
            h.toLowerCase() === field.key.toLowerCase() ||
            h.toLowerCase() === field.label.toLowerCase() ||
            cleanStr(h) === cleanStr(field.key) ||
            cleanStr(h) === cleanStr(field.label)
          ));
          if (matchIdx !== -1) { initialMapping[field.key] = matchIdx; usedCols.add(matchIdx); }
        });

        // Pass 2: Exact synonym match
        FIELDS_TO_MAP.forEach(field => {
          if (initialMapping[field.key] !== undefined) return;
          const matchIdx = hdrs.findIndex((h, i) => !usedCols.has(i) && field.synonyms.some(syn =>
            h.toLowerCase() === syn.toLowerCase() ||
            cleanStr(h) === cleanStr(syn)
          ));
          if (matchIdx !== -1) { initialMapping[field.key] = matchIdx; usedCols.add(matchIdx); }
        });

        // Pass 3: Partial (includes) synonym match — only for synonyms with 4+ chars to avoid false positives
        FIELDS_TO_MAP.forEach(field => {
          if (initialMapping[field.key] !== undefined) return;
          const matchIdx = hdrs.findIndex((h, i) => !usedCols.has(i) && field.synonyms.some(syn =>
            syn.length >= 4 && (
              h.toLowerCase().includes(syn.toLowerCase()) ||
              cleanStr(h).includes(cleanStr(syn))
            )
          ));
          if (matchIdx !== -1) { initialMapping[field.key] = matchIdx; usedCols.add(matchIdx); }
        });

        setColumnMapping(initialMapping);
        const parsed = parseRowsFromRaw(rows, initialMapping, {}, extractedImages);
        validateRows(parsed);
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setStep("preview");
          if (onAddNotification) onAddNotification("Success", `Excel parsed successfully (${rows.length} rows).`, "success");
        }, 400);
      } catch (err) {
        setIsUploading(false);
        if (onAddNotification) onAddNotification("Parsing Failed", "Error parsing Excel spreadsheet content.", "danger");
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const parseRowsFromRaw = (rowsToParse, mapping = {}, globalVals = {}, extractedImgs = {}) => {
    return rowsToParse.map((rawRow, idx) => {
      const getVal = (key) => {
        const colIdx = mapping[key];
        if (colIdx !== undefined) {
          const val = rawRow[colIdx];
          if (val !== undefined && val !== null && String(val).trim() !== "") return String(val).trim();
        }
        if (globalVals[key]) return globalVals[key];
        return "";
      };
      const getNum = (key) => {
        const val = getVal(key);
        if (!val) return 0;
        const parsedNum = parseFloat(String(val).replace(/[^0-9.-]/g, ""));
        return isNaN(parsedNum) ? 0 : parsedNum;
      };

      const formatExcelDate = (val) => {
        if (!val) return "";
        const str = String(val).trim();
        const num = parseFloat(str);
        if (!isNaN(num) && num > 10000 && str.match(/^\d+(\.\d+)?$/)) {
          const utc_days = Math.floor(num - 25569);
          const utc_value = utc_days * 86400;
          const date_info = new Date(utc_value * 1000);
          return date_info.toISOString().split("T")[0];
        }
        const ddmmyyyy = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
        if (ddmmyyyy) {
          const [, dd, mm, yyyy] = ddmmyyyy;
          return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        }
        const iso = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
        if (iso) {
          const [, yyyy, mm, dd] = iso;
          return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        }
        const d = new Date(str);
        if (!isNaN(d.getTime()) && d.getFullYear() > 1970) {
          return d.toISOString().split("T")[0];
        }
        return str;
      };

      const serialNumber = getVal("serialNumber") || (idx + 1);
      const billNo = getVal("billNo");
      const billDate = formatExcelDate(getVal("billDate")) || new Date().toISOString().split("T")[0];
      const vendorName = getVal("vendorName");
      const vendorGst = getVal("vendorGst");
      const vendorCode = getVal("vendorCode");
      const brand = getVal("brand");
      const ipn = getVal("ipn");
      const designNo = getVal("designNo");
      const barcode = getVal("barcode");
      const itemName = getVal("itemName");
      const subCategory = getVal("subCategory");
      const itemCode = getVal("itemCode") || (designNo ? `ITEM-${designNo}` : "");
      const quantity = getNum("quantity") || 1;
      const batch = getVal("batch");
      const counter = getVal("counter");
      const topBottomSet = getVal("topBottomSet");
      const gender = getVal("gender");
      const colorPrimary = getVal("colorPrimary");
      const colorSecondary = getVal("colorSecondary");
      const size = getVal("size");
      const purchaseRate = getNum("purchaseRate");
      const gstOnPurchase = getNum("gstOnPurchase");
      const typeOfGst = getVal("typeOfGst") || "E";
      const gstStatus = getVal("gstStatus") || "";
      let wspAfterGst = getNum("wspAfterGst");
      if (!wspAfterGst) {
        wspAfterGst = typeOfGst.toUpperCase() === "E" ? purchaseRate + (purchaseRate * (gstOnPurchase / 100)) : purchaseRate;
      }
      const mrp = getNum("mrp");
      const gstOnSalePrice = getNum("gstOnSalePrice");
      const rawDiscStatus = String(getVal("discountStatus") || "N").trim().toUpperCase();
      let discountStatus = "N";
      if (rawDiscStatus.startsWith("B")) discountStatus = "B";
      else if (rawDiscStatus.startsWith("A")) discountStatus = "A";
      else discountStatus = "N";
      const discountOnPurchase = getNum("discountOnPurchase");
      const hsnCode = getVal("hsnCode");
      const firm = getVal("firm");
      const transport = getVal("transport");
      const irnNo = getVal("irnNo");
      const state = getVal("state");
      const stateCode = getVal("stateCode");
      const uniqueCode = getVal("uniqueCode");

      let itemImage = getVal("itemImage");
      // Check if image was extracted for this row
      const rowImgMap = extractedImgs[idx + 1] || extractedImgs[idx];
      if (!itemImage && rowImgMap) {
        const imgColIdx = mapping["itemImage"];
        if (imgColIdx !== undefined && rowImgMap[imgColIdx]) {
          itemImage = rowImgMap[imgColIdx];
        } else {
          const firstKey = Object.keys(rowImgMap)[0];
          if (firstKey) itemImage = rowImgMap[firstKey];
        }
      }

      return {
        tempId: `row-${idx}-${Date.now()}`,
        serialNumber,
        billNo,
        billDate,
        vendorName,
        vendorGst,
        vendorCode,
        brand,
        ipn,
        designNo,
        barcode,
        itemName,
        subCategory,
        itemCode,
        quantity,
        batch,
        counter,
        topBottomSet,
        gender,
        colorPrimary,
        colorSecondary,
        size,
        purchaseRate,
        gstOnPurchase,
        typeOfGst,
        gstStatus,
        wspAfterGst,
        mrp,
        gstOnSalePrice,
        discountStatus,
        discountOnPurchase,
        hsnCode,
        firm,
        transport,
        irnNo,
        state,
        stateCode,
        uniqueCode,
        itemImage,
        errors: [],
        warnings: [],
        status: "valid",
        resolution: "none"
      };
    });
  };

  const validateRows = (rowsToValidate) => {
    const validated = rowsToValidate.map((row) => {
      const errors = [];
      const warnings = [];
      if (!row.vendorName) errors.push("Vendor Name is missing");
      if (!row.billNo) errors.push("Bill Number is missing");
      if (!row.itemName) errors.push("Item Name is missing");
      if (row.quantity <= 0) errors.push("Quantity must be greater than 0");
      if (row.purchaseRate <= 0) errors.push("Purchase Rate must be greater than 0");
      return { ...row, errors, warnings, status: errors.length > 0 ? "error" : "valid" };
    });
    setParsedRows(validated);
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...parsedRows];
    if (["quantity", "purchaseRate", "gstOnPurchase", "wspAfterGst", "mrp", "gstOnSalePrice", "discountOnPurchase"].includes(field)) {
      updated[index][field] = parseFloat(value) || 0;
    } else {
      updated[index][field] = value;
    }
    if (field === "purchaseRate" || field === "gstOnPurchase" || field === "typeOfGst") {
      const pRate = field === "purchaseRate" ? (parseFloat(value) || 0) : updated[index].purchaseRate;
      const gst = field === "gstOnPurchase" ? (parseFloat(value) || 0) : updated[index].gstOnPurchase;
      const gstType = field === "typeOfGst" ? value : updated[index].typeOfGst;
      if (gstType?.toUpperCase() === "E") {
        updated[index].wspAfterGst = parseFloat((pRate + (pRate * (gst / 100))).toFixed(2));
      } else {
        updated[index].wspAfterGst = pRate;
      }
    }
    validateRows(updated);
  };

  const handleTableKeyDown = (e, rowIndex, colKey) => {
    const colIndex = EDITABLE_COLUMNS.indexOf(colKey);
    if (colIndex === -1) return;
    const totalRows = parsedRows.length;
    const totalCols = EDITABLE_COLUMNS.length;

    // Enter: Navigate forward to next column (or next row's first column)
    if (e.key === "Enter") {
      e.preventDefault();
      if (colIndex < totalCols - 1) {
        const nextColKey = EDITABLE_COLUMNS[colIndex + 1];
        const nextEl = document.getElementById(`pt-cell-${rowIndex}-${nextColKey}`);
        if (nextEl) {
          nextEl.focus();
          if (typeof nextEl.select === "function") nextEl.select();
        }
      } else if (rowIndex < totalRows - 1) {
        const nextColKey = EDITABLE_COLUMNS[0];
        const nextEl = document.getElementById(`pt-cell-${rowIndex + 1}-${nextColKey}`);
        if (nextEl) {
          nextEl.focus();
          if (typeof nextEl.select === "function") nextEl.select();
        }
      }
      return;
    }

    // Down Arrow: Move down to same column in next row
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (rowIndex < totalRows - 1) {
        const nextEl = document.getElementById(`pt-cell-${rowIndex + 1}-${colKey}`);
        if (nextEl) {
          nextEl.focus();
          if (typeof nextEl.select === "function") nextEl.select();
        }
      }
      return;
    }

    // Up Arrow: Move up to same column in previous row
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (rowIndex > 0) {
        const prevEl = document.getElementById(`pt-cell-${rowIndex - 1}-${colKey}`);
        if (prevEl) {
          prevEl.focus();
          if (typeof prevEl.select === "function") prevEl.select();
        }
      }
      return;
    }

    // Left Arrow: Move backward to previous column (or previous row's last column)
    if (e.key === "ArrowLeft") {
      const val = e.target.value ?? "";
      const isAtStart = e.target.selectionStart === 0 && e.target.selectionEnd === 0;
      const isAllSelected = e.target.selectionStart === 0 && e.target.selectionEnd === val.length;
      if (isAtStart || isAllSelected || !val) {
        if (colIndex > 0) {
          e.preventDefault();
          const prevColKey = EDITABLE_COLUMNS[colIndex - 1];
          const prevEl = document.getElementById(`pt-cell-${rowIndex}-${prevColKey}`);
          if (prevEl) {
            prevEl.focus();
            if (typeof prevEl.select === "function") prevEl.select();
          }
        } else if (rowIndex > 0) {
          e.preventDefault();
          const prevColKey = EDITABLE_COLUMNS[totalCols - 1];
          const prevEl = document.getElementById(`pt-cell-${rowIndex - 1}-${prevColKey}`);
          if (prevEl) {
            prevEl.focus();
            if (typeof prevEl.select === "function") prevEl.select();
          }
        }
      }
      return;
    }

    // Right Arrow: Move forward to next column
    if (e.key === "ArrowRight") {
      const val = e.target.value ?? "";
      const isAtEnd = e.target.selectionStart === val.length;
      const isAllSelected = e.target.selectionStart === 0 && e.target.selectionEnd === val.length;
      if (isAtEnd || isAllSelected || !val) {
        if (colIndex < totalCols - 1) {
          e.preventDefault();
          const nextColKey = EDITABLE_COLUMNS[colIndex + 1];
          const nextEl = document.getElementById(`pt-cell-${rowIndex}-${nextColKey}`);
          if (nextEl) {
            nextEl.focus();
            if (typeof nextEl.select === "function") nextEl.select();
          }
        } else if (rowIndex < totalRows - 1) {
          e.preventDefault();
          const nextColKey = EDITABLE_COLUMNS[0];
          const nextEl = document.getElementById(`pt-cell-${rowIndex + 1}-${nextColKey}`);
          if (nextEl) {
            nextEl.focus();
            if (typeof nextEl.select === "function") nextEl.select();
          }
        }
      }
      return;
    }
  };

  const handleExportPTExcel = () => {
    if (!parsedRows || parsedRows.length === 0) {
      if (onAddNotification) onAddNotification("Export Info", "No PT rows available to export.", "info");
      return;
    }
    const exportData = parsedRows.map((r, idx) => ({
      "S.No.": r.serialNumber || (idx + 1),
      "Bill Number": r.billNo || "",
      "Bill Date": r.billDate || "",
      "Vendor Name": r.vendorName || "",
      "Vendor GST": r.vendorGst || "",
      "Vendor Code": r.vendorCode || "",
      "Brand": r.brand || "",
      "IPN": r.ipn || "",
      "Design No": r.designNo || "",
      "Barcode No": r.barcode || "",
      "Item Name": r.itemName || "",
      "Sub Item Name": r.subCategory || "",
      "Item Code": r.itemCode || "",
      "Total Qty.": r.quantity || 1,
      "Batch": r.batch || "",
      "Counter": r.counter || "",
      "Group 1 (Top/Bottom/Set)": r.topBottomSet || "",
      "Gender": r.gender || "",
      "Color (P)": r.colorPrimary || "",
      "Color (S)": r.colorSecondary || "",
      "Size": r.size || "",
      "P. Rate": r.purchaseRate || 0,
      "GST on Purchase (%)": r.gstOnPurchase || 0,
      "Type of GST (I/L)": r.typeOfGst || "E",
      "GST Status": r.gstStatus || "",
      "WSP After GST": r.wspAfterGst || 0,
      "MRP": r.mrp || 0,
      "GST on Sale (%)": r.gstOnSalePrice || 0,
      "Discount Status": r.discountStatus || "N",
      "Dis. on Purchase": r.discountOnPurchase || 0,
      "HSN Code": r.hsnCode || "",
      "Firm": r.firm || "",
      "Unique Code": r.uniqueCode || ""
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PT_Data");

    if (vendorDataRows && vendorDataRows.length > 0) {
      const vWs = XLSX.utils.json_to_sheet(vendorDataRows);
      XLSX.utils.book_append_sheet(wb, vWs, "Vendor Data");
    }

    const billNoClean = (parsedRows[0]?.billNo || "Export").replace(/[^a-zA-Z0-9_-]/g, "_");
    XLSX.writeFile(wb, `PT_File_${billNoClean}.xlsx`);
    if (onAddNotification) onAddNotification("PT File Exported", `Generated PT file for Bill ${parsedRows[0]?.billNo || ''} with all latest edits.`, "success");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleImportPTFileSubmit = async () => {
    if (isSubmittingRef.current) return;
    if (parsedRows.length === 0) {
      if (onAddNotification) onAddNotification("Error", "No valid data to import.", "danger");
      return;
    }
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    const errorCount = parsedRows.filter(r => r.status === "error").length;
    if (errorCount > 0) {
      if (onAddNotification) onAddNotification("Import Blocked", "Please resolve errors first.", "danger");
      return;
    }

    setIsImporting(true);
    setImportLoaderMessage("Processing PT records & compiling Purchase Vouchers... Please wait.");

    try {
      // Auto-create suppliers
      let currentSuppliers = [...(suppliers || [])];
      const uniqueVendors = Array.from(new Set(parsedRows.map(r => r.vendorName)));
      uniqueVendors.forEach(vendor => {
        if (!currentSuppliers.some(s => s.name?.toLowerCase() === vendor.toLowerCase())) {
          currentSuppliers.push({
            id: generateObjectId(),
            name: vendor,
            status: "Active",
            totalOrders: 0,
            outstandingBalance: 0,
            contactPerson: "N/A",
            gstin: "N/A",
            phone: "N/A",
          });
        }
      });

      // Map parsed rows directly without grouping, so each imported row is a distinct item in the PO
      let currentProducts = [...(products || [])];
      const billItems = parsedRows.filter(r => r.status === "valid").map(row => {
        const qty = row.quantity;
        const rate = row.purchaseRate;
        const itemSubTotal = qty * rate;

        let itemGst = 0;
        let taxable = itemSubTotal;
        let discAmt = row.discountOnPurchase || 0;

        if (row.typeOfGst?.toUpperCase() === "I") {
          const baseRate = rate / (1 + (row.gstOnPurchase / 100));
          taxable = qty * baseRate;
          itemGst = itemSubTotal - taxable;
        } else {
          itemGst = (taxable - discAmt) * (row.gstOnPurchase / 100);
        }

        const baseProductId = generateObjectId();

        return {
          ...row,
          productId: baseProductId,
          name: `${row.itemName} (${row.designNo})`,
          purchasePrice: rate,
          totalPrice: taxable - discAmt + itemGst,
          calculatedTaxable: taxable,
          calculatedGst: itemGst,
          calculatedTotal: taxable - discAmt + itemGst,
          calculatedDisc: discAmt
        };
      });

      const subTotal = billItems.reduce((sum, r) => sum + r.calculatedTaxable, 0);
      const gstTotal = billItems.reduce((sum, r) => sum + r.calculatedGst, 0);
      const grandDisc = billItems.reduce((sum, r) => sum + r.calculatedDisc, 0);

      const firstRow = parsedRows[0] || {};
      const currentVendorName = firstRow.vendorName || "";
      const currentVendorGst = firstRow.vendorGst || "";
      const currentVendorCode = firstRow.vendorCode || "";

      // Helper to find key in object case-insensitively ignoring punctuation/spaces
      const getVField = (obj, ...keys) => {
        if (!obj || typeof obj !== 'object') return "";
        const clean = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        for (const k of keys) {
          const target = clean(k);
          for (const [kObj, valObj] of Object.entries(obj)) {
            if (clean(kObj) === target && valObj !== undefined && valObj !== null && String(valObj).trim() !== "") {
              return String(valObj).trim();
            }
          }
        }
        return "";
      };

      // Match vendor from subsequent sheets (Sheet 2/3) or vendorDataRows
      let matchedVendorData = vendorDataRows.find(v => {
        const vName = getVField(v, 'VENDOR NAME', 'PARTY NAME', 'COMPANY NAME', 'Party Name', 'Vendor Name', 'Vendor');
        const vGst = getVField(v, 'GST NUMBER', 'GSTIN', 'Vendor GST');
        const vCode = getVField(v, 'VENDOR CODE', 'Vendor Code');
        return (vName && currentVendorName && vName.toLowerCase() === currentVendorName.toLowerCase()) ||
               (vGst && currentVendorGst && vGst.toLowerCase() === currentVendorGst.toLowerCase()) ||
               (vCode && currentVendorCode && vCode.toLowerCase() === currentVendorCode.toLowerCase());
      });

      if (!matchedVendorData && vendorDataRows.length === 1) {
        matchedVendorData = vendorDataRows[0];
      }

      const supplierObj = currentSuppliers.find(s =>
        (s.name && currentVendorName && s.name.toLowerCase() === currentVendorName.toLowerCase()) ||
        (currentVendorGst && s.gstin && s.gstin.toLowerCase() === currentVendorGst.toLowerCase()) ||
        (currentVendorCode && s.vendorCode && s.vendorCode.toLowerCase() === currentVendorCode.toLowerCase())
      );

      const vName = getVField(matchedVendorData, 'VENDOR NAME', 'COMPANY NAME', 'PARTY NAME', 'Party Name') || currentVendorName || supplierObj?.name || '';
      const vBrand = getVField(matchedVendorData, 'BRAND NAME(S)', 'BRAND NAME', 'BRAND NAMES', 'BRAND', 'Brand') || firstRow.brand || '';
      const vPhone = [getVField(matchedVendorData, 'SALES/GENERAL CONTACT', 'Phone', 'Contact', 'Mobile'), getVField(matchedVendorData, 'LANDLINE CONTACT', 'Landline')].filter(Boolean).join(' / ') || supplierObj?.phone || '';
      const vEmail = getVField(matchedVendorData, 'PRIMARY EMAIL', 'Email', 'Primary Email') || supplierObj?.email || '';
      const vAddress = getVField(matchedVendorData, 'OFFICE ADDRESS', 'Address', 'Office Address') || supplierObj?.address || '';
      const vCity = getVField(matchedVendorData, 'CITY', 'City') || supplierObj?.city || '';
      const vState = getVField(matchedVendorData, 'STATE', 'State') || supplierObj?.state || '';
      const vStateCode = getVField(matchedVendorData, 'STATE CODE', 'State Code') || supplierObj?.stateCode || '';
      const vPincode = getVField(matchedVendorData, 'PINCODE', 'Pincode', 'PIN') || supplierObj?.pincode || '';
      const vPan = getVField(matchedVendorData, 'PAN NUMBER', 'PAN') || supplierObj?.panNumber || '';
      const vGst = getVField(matchedVendorData, 'GST NUMBER', 'GSTIN', 'Vendor GST') || currentVendorGst || supplierObj?.gstin || '';
      const vCode = getVField(matchedVendorData, 'VENDOR CODE', 'Vendor Code') || currentVendorCode || supplierObj?.vendorCode || '';

      const vendorDetails = {
        name: vName,
        brand: vBrand,
        gstin: vGst,
        vendorCode: vCode,
        phone: vPhone,
        email: vEmail,
        address: vAddress,
        city: vCity,
        state: vState,
        stateCode: vStateCode,
        pincode: vPincode,
        panNumber: vPan,
        bankDetails: supplierObj?.bankDetails || (matchedVendorData ? {
          bankName: getVField(matchedVendorData, 'BANK NAME', 'Bank Name'),
          accountNumber: getVField(matchedVendorData, 'ACCOUNT NUMBER', 'Account Number', 'A/C NO'),
          ifscCode: getVField(matchedVendorData, 'IFSC CODE', 'IFSC'),
          branchName: getVField(matchedVendorData, 'BRANCH NAME', 'Branch'),
          upiId: getVField(matchedVendorData, 'UPI ID', 'UPI')
        } : null)
      };

      const getValidObjectId = (id) => {
        if (typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) return id;
        return generateObjectId();
      };

      const newVoucher = {
        id: generateObjectId(),
        poNo: firstRow.billNo,
        invoiceNo: firstRow.billNo,
        date: firstRow.billDate,
        supplierId: supplierObj ? getValidObjectId(supplierObj._id || supplierObj.id) : generateObjectId(),
        supplierName: vendorDetails.name || currentVendorName,
        vendorName: vendorDetails.name || currentVendorName,
        vendorGst: vendorDetails.gstin,
        vendorPhone: vendorDetails.phone,
        vendorEmail: vendorDetails.email,
        vendorAddress: vendorDetails.address,
        vendorCity: vendorDetails.city,
        vendorState: vendorDetails.state,
        vendorStateCode: vendorDetails.stateCode,
        vendorPincode: vendorDetails.pincode,
        vendorDetails: vendorDetails,
        brand: vendorDetails.brand || firstRow.brand || '',
        category: firstRow.itemName || '',
        firm: firstRow.firm || '',
        firmName: firstRow.firm || '',
        transport: firstRow.transport || getVField(matchedVendorData, 'TRANSPORT', 'Transport', 'Transporter') || '',
        irnNo: firstRow.irnNo || getVField(matchedVendorData, 'IRN NO', 'IRN', 'IRN NUMBER', 'IRN No.', 'E-Invoice IRN') || '',
        items: billItems,
        billItems: billItems,
        products: billItems,
        rows: billItems,
        subTotal: subTotal,
        gstTotal: gstTotal,
        grandTotal: subTotal - grandDisc + gstTotal,
        status: "Completed"
      };

      // Submit PT Excel rows to backend engine once (avoids duplicate item creation)
      setImportLoaderMessage("Saving inventory and generating distinct barcodes... Please wait.");
      try {
        const res = await api.post(`/pt-import`, { rows: parsedRows, vendorDataRows });
        if (res.data?.success) {
          if (onAddPurchaseOrder) {
            await onAddPurchaseOrder({ ...newVoucher, skipApiPost: true });
          }
        } else {
          throw new Error(res.data?.message || "Import failed on server.");
        }
      } catch (ptImportErr) {
        console.error("Backend /pt-import failed:", ptImportErr);
        throw new Error(ptImportErr.response?.data?.message || ptImportErr.message || "Failed to process PT File on backend");
      }

      setImportLoaderMessage("Purchase Voucher successfully generated! Finalizing...");
      await new Promise(resolve => setTimeout(resolve, 300));

      setCreatedVoucher(newVoucher);
      setStep("success");

      // Dispatch global refresh event to update downstream modules (Products, Stock, Vendors)
      window.dispatchEvent(new Event("vastra-data-refresh"));

      if (onAddNotification) onAddNotification("PT File Generated", `Bill ${firstRow.billNo} compiled and added to Procurement list!`, "success");
    } catch (error) {
      if (onAddNotification) onAddNotification("Import Error", error.message || "Failed to process PT File.", "danger");
    } finally {
      setIsImporting(false);
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleDownloadHTML = () => {
    if (!invoiceRef.current || !createdVoucher) return;

    // Create a standalone HTML string wrapping the invoice layout
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${createdVoucher.invoiceNo || createdVoucher.poNo}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body class="bg-white p-8">
        ${invoiceRef.current.outerHTML}
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice-${createdVoucher.invoiceNo || createdVoucher.poNo}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleWhatsAppShare = () => {
    if (!createdVoucher) return;
    const vName = createdVoucher.vendorName || createdVoucher.supplierName || "Tax Invoice";
    const billedTo = createdVoucher.firmName || createdVoucher.firm || createdVoucher.vendorName || '';
    const text = `*${vName} - Tax Invoice*\n\nInvoice No: ${createdVoucher.invoiceNo || createdVoucher.poNo}\nDate: ${createdVoucher.date}${billedTo ? `\nBilled To: ${billedTo}` : ''}\nTotal Amount: Rs ${Number(createdVoucher.grandTotal || 0).toFixed(2)}\n\nPlease review your invoice.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return "";
    let d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      const serial = parseFloat(dateStr);
      if (!isNaN(serial) && serial > 10000) {
        d = new Date((Math.floor(serial - 25569)) * 86400 * 1000);
      } else {
        return dateStr;
      }
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
      {/* PROFESSIONAL PT IMPORT LOADING OVERLAY */}
      {isImporting && (
        <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 flex flex-col items-center text-center max-w-md w-full animate-scale-up relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500"></div>

            <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 animate-ping opacity-25"></div>
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shadow-inner">
                <FileSpreadsheet className="w-6 h-6 animate-bounce" />
              </div>
            </div>

            <h3 className="text-base font-black text-slate-800 mb-1 tracking-wider uppercase">
              PT File Import System
            </h3>

            <p className="text-sm font-bold text-indigo-600 mb-4 animate-pulse">
              {importLoaderMessage || "Processing PT File & Generating Vouchers... Please wait."}
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 w-full text-left space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Validating PT File Records</span>
                <span className="text-emerald-600 font-bold">Complete</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" /> Saving Products & Inventory Pieces</span>
                <span className="text-purple-600 font-bold">In Progress</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-blue-500" /> Compiling Purchase Voucher & Bill</span>
                <span className="text-slate-800 font-bold">Syncing</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors z-10"
          title="Cancel Import"
        >
          <XCircle className="w-5 h-5" />
        </button>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-slate-100 bg-slate-50 gap-4 pr-16">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">PT File Importer</h2>
          <p className="text-xs text-slate-500 mt-1">Import professional Vendor Invoices, auto-generate distinct barcodes per quantity, and raise bills.</p>
        </div>
      </div>

      {step === "upload" && (
        <div className="p-8 space-y-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="max-w-2xl mx-auto border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl p-12 text-center cursor-pointer transition-all"
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls, .csv" className="hidden" />
            <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-700">Upload PT File</h3>
            <p className="text-xs text-slate-500 mt-1">Drag & drop your Excel file here or click to browse</p>
          </div>
        </div>
      )}



      {step === "preview" && (
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800">Review Data</h3>
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {parsedRows.length} Rows
                </span>
                {parsedRows.filter(r => r.status === "error").length > 0 && (
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {parsedRows.filter(r => r.status === "error").length} Errors
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">All 33 columns from your PT file are listed below. You can scroll horizontally and edit any values before compiling.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep("upload")}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Re-upload File
              </button>
              <button
                onClick={handleExportPTExcel}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                title="Export updated PT spreadsheet with all current edits"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export PT File</span>
              </button>
              <button
                onClick={handleImportPTFileSubmit}
                disabled={isSubmitting || parsedRows.filter(r => r.status === "error").length > 0}
                className={`px-5 py-2 text-xs text-white rounded-lg font-bold shadow transition-all cursor-pointer ${isSubmitting || parsedRows.filter(r => r.status === "error").length > 0 ? 'bg-slate-400 cursor-not-allowed opacity-70' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'}`}
              >
                {isSubmitting ? 'Compiling & Saving...' : 'Compile & Save Vouchers'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[65vh] shadow-inner bg-white">
            <table className="w-full text-xs text-left whitespace-nowrap">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold sticky top-0 z-20 shadow-sm border-b border-slate-200">
                <tr>
                  <th className="p-3 sticky left-0 bg-slate-100 z-30 text-center border-r border-slate-200">Status</th>
                  <th className="p-3 border-r border-slate-200">S.No.</th>
                  <th className="p-3 border-r border-slate-200">Bill Number</th>
                  <th className="p-3 border-r border-slate-200">Bill Date</th>
                  <th className="p-3 border-r border-slate-200">Vendor Name</th>
                  <th className="p-3 border-r border-slate-200">Vendor GST</th>
                  <th className="p-3 border-r border-slate-200">Vendor Code</th>
                  <th className="p-3 border-r border-slate-200">Brand</th>
                  <th className="p-3 border-r border-slate-200">IPN</th>
                  <th className="p-3 border-r border-slate-200">Design No</th>
                  <th className="p-3 border-r border-slate-200">Barcode No</th>
                  <th className="p-3 border-r border-slate-200">Item Name</th>
                  <th className="p-3 border-r border-slate-200">Sub Item Name</th>
                  <th className="p-3 border-r border-slate-200">Item Code</th>
                  <th className="p-3 border-r border-slate-200">Total Qty.</th>
                  <th className="p-3 border-r border-slate-200">Batch</th>
                  <th className="p-3 border-r border-slate-200">Counter</th>
                  <th className="p-3 border-r border-slate-200">Group 1 (Top/Bottom/Set)</th>
                  <th className="p-3 border-r border-slate-200">Gender</th>
                  <th className="p-3 border-r border-slate-200">Color (P)</th>
                  <th className="p-3 border-r border-slate-200">Color (S)</th>
                  <th className="p-3 border-r border-slate-200">Size</th>
                  <th className="p-3 border-r border-slate-200">P. Rate</th>
                  <th className="p-3 border-r border-slate-200">GST on Purchase (%)</th>
                  <th className="p-3 border-r border-slate-200">Type of GST (I/L)</th>
                  <th className="p-3 border-r border-slate-200">GST Status</th>
                  <th className="p-3 border-r border-slate-200">WSP After GST</th>
                  <th className="p-3 border-r border-slate-200">MRP</th>
                  <th className="p-3 border-r border-slate-200">GST on Sale (%)</th>
                  <th className="p-3 border-r border-slate-200">Discount Status</th>
                  <th className="p-3 border-r border-slate-200">Dis. on Purchase</th>
                  <th className="p-3 border-r border-slate-200">HSN Code</th>
                  <th className="p-3 border-r border-slate-200">Firm</th>
                  <th className="p-3 border-r border-slate-200">Unique Code</th>
                  <th className="p-3">Item Image</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedRows.map((r, i) => (
                  <tr key={i} className={`hover:bg-slate-50/80 transition-colors ${r.status === 'error' ? 'bg-red-50/50' : ''}`}>
                    <td className="p-2 sticky left-0 bg-white z-10 text-center border-r border-slate-200">
                      {r.status === "error" ? (
                        <span title={r.errors?.join(', ')} className="inline-flex cursor-pointer">
                          <XCircle className="text-red-500 w-4 h-4" />
                        </span>
                      ) : (
                        <CheckCircle2 className="text-emerald-500 w-4 h-4 inline" />
                      )}
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-serialNumber`}
                        value={r.serialNumber || (i + 1)}
                        onChange={(e) => handleRowChange(i, 'serialNumber', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'serialNumber')}
                        className="w-14 p-1.5 border border-slate-200 rounded text-xs text-center focus:border-indigo-500 focus:outline-none bg-slate-50"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-billNo`}
                        value={r.billNo}
                        onChange={(e) => handleRowChange(i, 'billNo', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'billNo')}
                        className="w-24 p-1.5 border border-slate-200 rounded text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-billDate`}
                        type="date"
                        value={r.billDate}
                        onChange={(e) => handleRowChange(i, 'billDate', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'billDate')}
                        className="w-28 p-1.5 border border-slate-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-vendorName`}
                        value={r.vendorName}
                        onChange={(e) => handleRowChange(i, 'vendorName', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'vendorName')}
                        className="w-36 p-1.5 border border-slate-200 rounded text-xs focus:border-indigo-500 focus:outline-none font-medium"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-vendorGst`}
                        value={r.vendorGst || ''}
                        onChange={(e) => handleRowChange(i, 'vendorGst', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'vendorGst')}
                        className="w-36 p-1.5 border border-slate-200 rounded text-xs font-mono focus:border-indigo-500 focus:outline-none"
                        placeholder="GSTIN"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-vendorCode`}
                        value={r.vendorCode || ''}
                        onChange={(e) => handleRowChange(i, 'vendorCode', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'vendorCode')}
                        className="w-24 p-1.5 border border-slate-200 rounded text-xs focus:border-indigo-500 focus:outline-none font-mono"
                        placeholder="Vendor Code"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-brand`}
                        value={r.brand || ''}
                        onChange={(e) => handleRowChange(i, 'brand', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'brand')}
                        className="w-24 p-1.5 border border-slate-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
                        placeholder="Brand"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-ipn`}
                        value={r.ipn || ''}
                        onChange={(e) => handleRowChange(i, 'ipn', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'ipn')}
                        className="w-16 p-1.5 border border-slate-200 rounded text-xs text-center focus:border-indigo-500 focus:outline-none"
                        placeholder="IPN"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-designNo`}
                        value={r.designNo || ''}
                        onChange={(e) => handleRowChange(i, 'designNo', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'designNo')}
                        className="w-24 p-1.5 border border-slate-200 rounded text-xs font-medium focus:border-indigo-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-barcode`}
                        value={r.barcode || ''}
                        onChange={(e) => handleRowChange(i, 'barcode', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'barcode')}
                        className="w-28 p-1.5 border border-slate-200 rounded text-xs font-mono focus:border-indigo-500 focus:outline-none"
                        placeholder="Barcode"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-itemName`}
                        value={r.itemName || ''}
                        onChange={(e) => handleRowChange(i, 'itemName', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'itemName')}
                        className="w-32 p-1.5 border border-slate-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-subCategory`}
                        value={r.subCategory || ''}
                        onChange={(e) => handleRowChange(i, 'subCategory', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'subCategory')}
                        className="w-28 p-1.5 border border-slate-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
                        placeholder="Sub Item"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-itemCode`}
                        value={r.itemCode || ''}
                        onChange={(e) => handleRowChange(i, 'itemCode', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'itemCode')}
                        className="w-28 p-1.5 border border-slate-200 rounded text-xs font-mono focus:border-indigo-500 focus:outline-none"
                        placeholder="Item Code"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-quantity`}
                        type="number"
                        value={r.quantity}
                        onChange={(e) => handleRowChange(i, 'quantity', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'quantity')}
                        className="w-16 p-1.5 border border-slate-200 rounded text-xs text-center font-bold focus:border-indigo-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-batch`}
                        value={r.batch || ''}
                        onChange={(e) => handleRowChange(i, 'batch', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'batch')}
                        className="w-36 p-1.5 border border-slate-200 rounded text-xs font-mono focus:border-indigo-500 focus:outline-none"
                        placeholder="Batch"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-counter`}
                        value={r.counter || ''}
                        onChange={(e) => handleRowChange(i, 'counter', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'counter')}
                        className="w-28 p-1.5 border border-slate-200 rounded text-xs font-mono focus:border-indigo-500 focus:outline-none"
                        placeholder="Counter"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-topBottomSet`}
                        value={r.topBottomSet || ''}
                        onChange={(e) => handleRowChange(i, 'topBottomSet', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'topBottomSet')}
                        className="w-24 p-1.5 border border-slate-200 rounded text-xs text-center focus:border-indigo-500 focus:outline-none"
                        placeholder="set / top / etc"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-gender`}
                        value={r.gender || ''}
                        onChange={(e) => handleRowChange(i, 'gender', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'gender')}
                        className="w-20 p-1.5 border border-slate-200 rounded text-xs text-center focus:border-indigo-500 focus:outline-none"
                        placeholder="Gender"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-colorPrimary`}
                        value={r.colorPrimary || ''}
                        onChange={(e) => handleRowChange(i, 'colorPrimary', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'colorPrimary')}
                        className="w-24 p-1.5 border border-slate-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
                        placeholder="Color (P)"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-colorSecondary`}
                        value={r.colorSecondary || ''}
                        onChange={(e) => handleRowChange(i, 'colorSecondary', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'colorSecondary')}
                        className="w-24 p-1.5 border border-slate-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
                        placeholder="Color (S)"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-size`}
                        value={r.size || ''}
                        onChange={(e) => handleRowChange(i, 'size', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'size')}
                        className="w-16 p-1.5 border border-slate-200 rounded text-xs text-center focus:border-indigo-500 focus:outline-none"
                        placeholder="Size"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-purchaseRate`}
                        type="number"
                        step="any"
                        value={r.purchaseRate}
                        onChange={(e) => handleRowChange(i, 'purchaseRate', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'purchaseRate')}
                        className="w-20 p-1.5 border border-slate-200 rounded text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-gstOnPurchase`}
                        type="number"
                        step="any"
                        value={r.gstOnPurchase}
                        onChange={(e) => handleRowChange(i, 'gstOnPurchase', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'gstOnPurchase')}
                        className="w-16 p-1.5 border border-slate-200 rounded text-xs text-center focus:border-indigo-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-typeOfGst`}
                        value={r.typeOfGst || 'E'}
                        onChange={(e) => handleRowChange(i, 'typeOfGst', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'typeOfGst')}
                        className="w-16 p-1.5 border border-slate-200 rounded text-xs text-center font-bold focus:border-indigo-500 focus:outline-none"
                        placeholder="E / I / L"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-gstStatus`}
                        value={r.gstStatus || ''}
                        onChange={(e) => handleRowChange(i, 'gstStatus', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'gstStatus')}
                        className="w-32 p-1.5 border border-slate-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
                        placeholder="GST Status"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-wspAfterGst`}
                        type="number"
                        step="any"
                        value={r.wspAfterGst}
                        onChange={(e) => handleRowChange(i, 'wspAfterGst', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'wspAfterGst')}
                        className="w-20 p-1.5 border border-slate-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-mrp`}
                        type="number"
                        step="any"
                        value={r.mrp}
                        onChange={(e) => handleRowChange(i, 'mrp', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'mrp')}
                        className="w-20 p-1.5 border border-slate-200 rounded text-xs font-semibold text-emerald-700 focus:border-indigo-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-gstOnSalePrice`}
                        type="number"
                        step="any"
                        value={r.gstOnSalePrice}
                        onChange={(e) => handleRowChange(i, 'gstOnSalePrice', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'gstOnSalePrice')}
                        className="w-16 p-1.5 border border-slate-200 rounded text-xs text-center focus:border-indigo-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-discountStatus`}
                        value={r.discountStatus || 'N'}
                        onChange={(e) => handleRowChange(i, 'discountStatus', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'discountStatus')}
                        className="w-16 p-1.5 border border-slate-200 rounded text-xs text-center font-bold focus:border-indigo-500 focus:outline-none"
                        placeholder="N/B/A"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-discountOnPurchase`}
                        type="number"
                        step="any"
                        value={r.discountOnPurchase}
                        onChange={(e) => handleRowChange(i, 'discountOnPurchase', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'discountOnPurchase')}
                        className="w-20 p-1.5 border border-slate-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-hsnCode`}
                        value={r.hsnCode || ''}
                        onChange={(e) => handleRowChange(i, 'hsnCode', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'hsnCode')}
                        className="w-24 p-1.5 border border-slate-200 rounded text-xs font-mono focus:border-indigo-500 focus:outline-none"
                        placeholder="HSN"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-firm`}
                        value={r.firm || ''}
                        onChange={(e) => handleRowChange(i, 'firm', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'firm')}
                        className="w-40 p-1.5 border border-slate-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
                        placeholder="Firm"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-100">
                      <input
                        id={`pt-cell-${i}-uniqueCode`}
                        value={r.uniqueCode || ''}
                        onChange={(e) => handleRowChange(i, 'uniqueCode', e.target.value)}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'uniqueCode')}
                        className="w-28 p-1.5 border border-slate-200 rounded text-xs font-mono focus:border-indigo-500 focus:outline-none"
                        placeholder="Unique Code"
                      />
                    </td>
                    <td className="p-1.5 text-center">
                      {r.itemImage ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <div
                            onClick={() => setSelectedImagePreview({ url: r.itemImage, name: r.itemName || r.designNo })}
                            className="relative group cursor-pointer"
                            title="Click to view full image"
                          >
                            <img
                              src={r.itemImage}
                              alt="Product"
                              className="w-9 h-9 object-cover rounded-lg border border-slate-300 shadow-sm transition-transform group-hover:scale-110 bg-white"
                            />
                            <div className="absolute inset-0 bg-black/30 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <ZoomIn className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No Image</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Lightbox Modal for enlarged image preview */}
          {selectedImagePreview && (
            <div
              className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fade-in"
              onClick={() => setSelectedImagePreview(null)}
            >
              <div
                className="relative bg-white rounded-2xl p-5 max-w-md w-full max-h-[85vh] shadow-2xl flex flex-col items-center border border-slate-100"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedImagePreview(null)}
                  className="absolute top-3 right-3 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h4 className="text-sm font-bold text-slate-800 mb-3 self-start truncate max-w-[80%]">
                  {selectedImagePreview.name || "Item Image Preview"}
                </h4>
                <div className="w-full flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-slate-50 border border-slate-200 p-2">
                  <img
                    src={selectedImagePreview.url}
                    alt="Enlarged preview"
                    className="max-h-[60vh] max-w-full object-contain rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}      {step === "success" && createdVoucher && (
        <InvoiceViewer
          createdVoucher={createdVoucher}
          invoiceRef={invoiceRef}
          handlePrint={() => window.print()}
          handleDownloadHTML={handleDownloadHTML}
          handleWhatsAppShare={handleWhatsAppShare}
          handleExportPTExcel={handleExportPTExcel}
          onClose={() => {
            // Full reset so the user can import the same or a new PT file immediately
            setStep("upload");
            setRawRows([]);
            setHeaders([]);
            setColumnMapping({});
            setGlobalValues({});
            setParsedRows([]);
            setCreatedVoucher(null);
          }}
        />
      )}
    </div>
  );
};

export const InvoiceViewer = ({ createdVoucher = {}, invoiceRef, handlePrint, handleDownloadHTML, handleWhatsAppShare, handleExportPTExcel, onClose }) => {
  // Audit Tracking
  React.useEffect(() => {
    if (createdVoucher && (createdVoucher.billNo || createdVoucher._id)) {
      api.post('/audit/track', {
        action: 'VIEW',
        item: `Purchase Bill #${createdVoucher.billNo || createdVoucher._id}`, // Fallback for old logs
        moduleName: 'PT_IMPORT',
        entityType: 'PT_FILE',
        entityId: createdVoucher._id,
        displayName: `PT File: ${createdVoucher.billNo || createdVoucher._id} - ${createdVoucher.vendorName || 'Unknown Vendor'}`,
        details: { purchaseId: createdVoucher._id }
      }).catch(err => console.error("Failed to track audit log", err));
    }
  }, [createdVoucher]);

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString('en-GB');
    let d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      const serial = parseFloat(dateStr);
      if (!isNaN(serial) && serial > 10000) {
        d = new Date((Math.floor(serial - 25569)) * 86400 * 1000);
      } else {
        return String(dateStr);
      }
    }
    if (d.getFullYear() <= 1970) return new Date().toLocaleDateString('en-GB');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const numberToWords = (num) => {
    if (isNaN(num) || num === null || num === undefined) return "ZERO";
    num = Math.round(Number(num));
    if (num <= 0) return "ZERO";

    const a = ['', 'ONE ', 'TWO ', 'THREE ', 'FOUR ', 'FIVE ', 'SIX ', 'SEVEN ', 'EIGHT ', 'NINE ', 'TEN ', 'ELEVEN ', 'TWELVE ', 'THIRTEEN ', 'FOURTEEN ', 'FIFTEEN ', 'SIXTEEN ', 'SEVENTEEN ', 'EIGHTEEN ', 'NINETEEN '];
    const b = ['', '', 'TWENTY ', 'THIRTY ', 'FORTY ', 'FIFTY ', 'SIXTY ', 'SEVENTY ', 'EIGHTY ', 'NINETY '];

    const inWords = (n) => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + a[n % 10];
      if (n < 1000) return a[Math.floor(n / 100)] + 'HUNDRED ' + inWords(n % 100);
      if (n < 100000) return inWords(Math.floor(n / 1000)) + 'THOUSAND ' + inWords(n % 1000);
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'LAKH ' + inWords(n % 100000);
      return inWords(Math.floor(n / 10000000)) + 'CRORE ' + inWords(n % 10000000);
    };

    return inWords(num).trim();
  };

  const internalRef = React.useRef(null);
  const activeRef = invoiceRef || internalRef;

  const voucher = createdVoucher || {};
  const [fetchedVendor, setFetchedVendor] = React.useState(null);

  React.useEffect(() => {
    const sId = voucher.supplierId || voucher.vendorId?._id || (typeof voucher.vendorId === 'string' ? voucher.vendorId : null);
    if (!voucher.vendorDetails && sId && /^[0-9a-fA-F]{24}$/.test(sId)) {
      api.get(`/vendors/${sId}`)
        .then(res => {
          if (res.data?.data) setFetchedVendor(res.data.data);
        })
        .catch(() => {});
    }
  }, [voucher.supplierId, voucher.vendorId, voucher.vendorDetails]);

  // Extract Vendor / Supplier Details (The Seller/Issuer of the Tax Invoice)
  const vendorObj = voucher.vendorDetails || fetchedVendor || voucher.vendorId || voucher.supplier || voucher.vendor || {};

  const vendorName =
    voucher.vendorName ||
    voucher.supplierName ||
    vendorObj.name ||
    vendorObj.companyName ||
    vendorObj.businessName ||
    (typeof voucher.vendor === "string" ? voucher.vendor : "") ||
    (typeof voucher.supplier === "string" ? voucher.supplier : "") ||
    "";

  const vendorGst =
    voucher.vendorGst ||
    vendorObj.gstin ||
    vendorObj.gst ||
    vendorObj.gstNumber ||
    voucher.gstin ||
    "";

  const vendorPhone =
    voucher.vendorPhone ||
    vendorObj.phone ||
    vendorObj.mobile ||
    vendorObj.contact ||
    "";

  const vendorEmail =
    voucher.vendorEmail ||
    vendorObj.email ||
    "";

  const vendorAddress =
    voucher.vendorAddress ||
    vendorObj.address ||
    vendorObj.officeAddress ||
    "";

  const vendorCity =
    voucher.vendorCity ||
    vendorObj.city ||
    "";

  const vendorState =
    voucher.vendorState ||
    vendorObj.state ||
    "";

  const vendorStateCode =
    voucher.vendorStateCode ||
    vendorObj.stateCode ||
    "";

  const vendorPincode =
    voucher.vendorPincode ||
    vendorObj.pincode ||
    "";

  const brandName =
    voucher.brand ||
    vendorObj.brand ||
    vendorObj.brandNames ||
    "";

  const rawCategory =
    voucher.category ||
    (voucher.items && voucher.items[0]?.itemName) ||
    (voucher.billItems && voucher.billItems[0]?.itemName) ||
    (voucher.products && voucher.products[0]?.itemName) ||
    "";

  const categoryBanner = (rawCategory && rawCategory.toUpperCase() !== "FABRIC SUIT" && rawCategory.toUpperCase() !== "GENERIC" && rawCategory.toUpperCase() !== "N/A")
    ? rawCategory
    : (rawCategory && rawCategory.toUpperCase() !== "N/A" ? rawCategory : "");

  // Format Office Address cleanly without duplicates
  const formatVendorAddress = (addr, city, state, pin, phone) => {
    if (!addr && !city && !state && !pin) return "";
    let parts = [];
    if (addr) parts.push(addr.trim());
    if (city && (!addr || !addr.toLowerCase().includes(city.toLowerCase()))) parts.push(city.trim());
    if (state && (!addr || !addr.toLowerCase().includes(state.toLowerCase()))) parts.push(state.trim());
    if (pin && (!addr || !addr.includes(pin))) parts.push(pin.trim());
    let res = parts.join(", ");
    if (phone && (!addr || !addr.includes(phone))) {
      res += ` Ph. : ${phone}`;
    }
    return res;
  };

  const formattedAddress = formatVendorAddress(vendorAddress, vendorCity, vendorState, vendorPincode, vendorPhone);

  // Details of Receiver | Billed To (Populated from Vendor Card data)
  const receiverName = vendorName || voucher.firmName || voucher.firm || "";
  const receiverGst = vendorGst || voucher.firmGst || "";
  const receiverAddress = formattedAddress || vendorAddress || voucher.firmAddress || "";
  const receiverState = vendorState || voucher.firmState || "";
  const receiverStateCode = vendorStateCode || voucher.firmStateCode || "";
  const transport = voucher.transport || "";
  const irnNo = voucher.irnNo || voucher.irn || "";

  // Extract Invoice / PO Number
  const invoiceNo =
    voucher.poNo ||
    voucher.invoiceNo ||
    voucher.billNo ||
    voucher.voucherNo ||
    voucher.referenceNo ||
    voucher.id ||
    voucher._id ||
    "N/A";

  // Extract Date
  const voucherDate = voucher.date || voucher.billDate || voucher.createdAt || voucher.createdDate || "";

  // Normalize Items List
  let rawItems = [];
  const candidateItems =
    voucher.items ||
    voucher.billItems ||
    voucher.purchaseItems ||
    voucher.products ||
    voucher.itemList ||
    voucher.productsList ||
    voucher.rows ||
    voucher.itemDetails ||
    voucher.details ||
    voucher.cart;

  if (Array.isArray(candidateItems) && candidateItems.length > 0) {
    rawItems = candidateItems;
  } else if (typeof candidateItems === "string" && candidateItems.trim()) {
    rawItems = [{ name: candidateItems }];
  } else if (voucher.productName || voucher.itemName || voucher.name) {
    rawItems = [{
      name: voucher.productName || voucher.itemName || voucher.name,
      hsnCode: voucher.hsnCode || voucher.hsn,
      quantity: voucher.quantity || voucher.qty,
      purchaseRate: voucher.purchaseRate || voucher.purchasePrice || voucher.rate,
      totalPrice: voucher.totalPrice || voucher.grandTotal || voucher.amount
    }];
  }

  // Automatic Fallback: If rawItems is empty but bill has a non-zero amount/grandTotal
  const estimatedGrandTotal = Number(voucher.grandTotal ?? voucher.totalAmount ?? voucher.amount ?? voucher.subTotal ?? 0);
  if (rawItems.length === 0 && estimatedGrandTotal > 0) {
    const fallbackName = vendorName
      ? `GARMENT ITEMS (${vendorName})`
      : `GARMENT ITEMS (INV ${invoiceNo || ''})`;
    const fallbackQty = Number(voucher.quantity || voucher.totalQty || voucher.qty || 1);
    const fallbackRate = estimatedGrandTotal / fallbackQty;

    rawItems = [{
      name: fallbackName,
      hsnCode: voucher.hsnCode || "5208",
      quantity: fallbackQty,
      purchaseRate: fallbackRate,
      totalPrice: estimatedGrandTotal,
      calculatedTaxable: estimatedGrandTotal
    }];
  }

  const itemsList = rawItems.map((item, idx) => {
    if (typeof item === "string") {
      const quantity = Number(voucher.quantity || voucher.qty || 1);
      const rate = Number(voucher.purchaseRate || voucher.rate || voucher.purchasePrice || 0);
      let gstPercent = voucher.gstOnPurchase ?? voucher.taxRate ?? voucher.gstPercent ?? voucher.gst ?? 5;
      if (typeof gstPercent === 'string') {
        gstPercent = parseFloat(gstPercent.replace('%', '')) || 0;
      }
      gstPercent = Number(gstPercent);
      const taxable = quantity * rate;
      const gstAmt = (taxable * gstPercent) / 100;
      const amount = taxable + gstAmt;
      return {
        id: idx,
        name: item,
        hsnCode: "5208",
        quantity,
        rate,
        gstPercent,
        gstAmount: gstAmt,
        taxable,
        amount
      };
    }

    const name = item.name || item.itemName || item.productName || item.title || item.itemCode || (item.designNo ? `Design ${item.designNo}` : `Item #${idx + 1}`);
    const hsnCode = item.hsnCode || item.hsn || item.sac || "5208";
    const quantity = Number(item.quantity ?? item.qty ?? item.count ?? 1);
    const rate = Number(item.purchaseRate ?? item.purchasePrice ?? item.rate ?? item.price ?? item.mrp ?? 0);

    let gstPercent = item.gstOnPurchase ?? item.taxRate ?? item.gstPercent ?? item.gst ?? 0;
    if (typeof gstPercent === 'string') {
      gstPercent = parseFloat(gstPercent.replace('%', '')) || 0;
    }
    gstPercent = Number(gstPercent);

    let discAmt = Number(item.discountOnPurchase ?? item.discount ?? 0);
    let taxable = Number(item.calculatedTaxable ?? (quantity * rate));
    let gstAmt = Number(item.calculatedGst ?? 0);

    if (!gstAmt && gstPercent > 0) {
      if (item.typeOfGst?.toUpperCase() === "I") {
        const baseRate = rate / (1 + (gstPercent / 100));
        taxable = quantity * baseRate;
        gstAmt = (quantity * rate) - taxable;
      } else {
        gstAmt = (taxable - discAmt) * (gstPercent / 100);
      }
    }

    // Amount on bill = Purchase Rate (Taxable) + GST on purchase
    const amount = Number(item.calculatedTotal ?? item.totalPrice ?? (taxable - discAmt + gstAmt));

    return {
      id: idx,
      name,
      hsnCode,
      quantity,
      rate,
      gstPercent,
      gstAmount: gstAmt,
      taxable,
      discount: discAmt,
      amount
    };
  });

  // Financial Calculations
  const totalQty = itemsList.reduce((acc, item) => acc + (item.quantity || 0), 0);
  const totalAmount = itemsList.reduce((acc, item) => acc + (item.amount || 0), 0);

  const grandTotal = totalAmount > 0 ? totalAmount : Number(voucher.grandTotal ?? voucher.totalAmount ?? voucher.amount ?? 0);

  // Derive GST breakdown percentage from imported item rows
  const uniqueGstRates = Array.from(new Set(itemsList.map(item => item.gstPercent).filter(p => p > 0)));
  let cgstRateDisplay = '2.5%';
  let sgstRateDisplay = '2.5%';
  let igstRateDisplay = '5%';

  if (uniqueGstRates.length === 1) {
    const r = uniqueGstRates[0];
    cgstRateDisplay = `${(r / 2)}%`;
    sgstRateDisplay = `${(r / 2)}%`;
    igstRateDisplay = `${r}%`;
  } else if (uniqueGstRates.length > 1) {
    cgstRateDisplay = uniqueGstRates.map(r => `${r / 2}%`).join(', ');
    sgstRateDisplay = uniqueGstRates.map(r => `${r / 2}%`).join(', ');
    igstRateDisplay = uniqueGstRates.map(r => `${r}%`).join(', ');
  }

  const isInterState = voucher.typeOfGst?.toUpperCase() === "I" || (vendorState && receiverState && vendorState.toLowerCase() !== receiverState.toLowerCase());

  const onDownloadHTML = handleDownloadHTML || (() => {
    if (!activeRef.current) return;
    const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${invoiceNo}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="p-8 bg-white text-black font-sans">
  ${activeRef.current.innerHTML}
</body>
</html>`;
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${String(invoiceNo).replace(/[^a-zA-Z0-9_-]/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  });

  const onWhatsAppShare = handleWhatsAppShare || (() => {
    if (!createdVoucher) return;
    const billedToText = receiverName ? `\nBilled To: ${receiverName}` : '';
    const text = `*${vendorName || 'Tax Invoice'}*\n\nInvoice No: ${invoiceNo}\nDate: ${formatDateForDisplay(voucherDate)}${billedToText}\nTotal Amount: Rs ${grandTotal.toFixed(2)}\n\nPlease review your invoice.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  });

  return (
    <div className="p-8 bg-slate-50 min-h-screen relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full transition-colors z-10"
          title="Go Back"
        >
          <XCircle className="w-6 h-6" />
        </button>
      )}
      <div ref={activeRef} className="max-w-4xl mx-auto bg-white shadow-xl p-8 rounded-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Vendor/Seller Branding Header */}
        <div className="text-center mb-4 border-b-2 border-red-600 pb-2">
          <div className="flex justify-between items-start text-[10px] font-bold uppercase mb-2">
            <div>
              {vendorGst ? <span>GSTIN : {vendorGst}</span> : <span></span>}
            </div>
            <div className="text-right">
              {vendorPhone ? <span className="text-blue-600 block">CONTACT : {vendorPhone}</span> : null}
              {vendorEmail ? <span className="text-slate-600 block lowercase font-normal">email : {vendorEmail}</span> : null}
            </div>
          </div>

          {vendorName ? (
            <h1 className="text-4xl sm:text-5xl font-bold text-red-600 tracking-wider uppercase" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              {vendorName}
            </h1>
          ) : null}

          {brandName && brandName.toUpperCase() !== "N/A" && brandName.toUpperCase() !== "NA" && brandName.toUpperCase() !== "GENERIC BRAND" ? (
            <p className="text-sm text-green-700 italic mt-1 font-semibold">Brand : {brandName}</p>
          ) : null}

          {categoryBanner ? (
            <div className="bg-blue-800 text-white inline-block px-6 py-1 mt-3 mb-2 rounded-sm text-base sm:text-lg font-bold tracking-widest shadow-sm uppercase">
              {categoryBanner}
            </div>
          ) : null}

          {formattedAddress ? (
            <div className="text-xs font-bold text-slate-800 mt-1">
              <p>Head Office : {formattedAddress}</p>
            </div>
          ) : null}
        </div>

        <div className="text-center mb-6">
          <span className="inline-block border border-black px-6 py-1 italic font-bold text-sm tracking-wide">TAX INVOICE</span>
        </div>

        <div className="flex justify-between mb-4 text-xs font-bold">
          <div className="w-1/2">
            <p className="border-b border-black inline-block mb-1">Details of Receiver | Billed To</p>
            <p>Name : <span className="ml-2 uppercase">{receiverName}</span></p>
            <p>GSTIN : <span className="ml-2">{receiverGst}</span></p>
            <p className="flex"><span className="mr-2">Address :</span> <span className="uppercase whitespace-pre-line">{receiverAddress}</span></p>
            <p>State Name : <span className="uppercase">{receiverState}</span> <span className="ml-6">State Code : {receiverStateCode}</span></p>
            <p>Transport : <span className="uppercase">{transport}</span></p>
          </div>
          <div className="w-1/2 text-right">
            <p>Page No. 1 of 1</p>
            <p className="mt-4">
              Invoice No. <span className="font-extrabold text-base ml-2">{invoiceNo}</span> 
              <span className="ml-4">Date {formatDateForDisplay(voucherDate)}</span>
            </p>
            <p className="mt-1">State Name : {receiverState} <span className="ml-4">State Code {receiverStateCode}</span></p>
            {irnNo ? (
              <div className="mt-3 text-[10px] max-w-[250px] float-right leading-tight text-right">
                <span className="font-bold text-slate-800 mr-1">IRN No:</span>
                <span className="break-all text-slate-700">{irnNo}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="w-full flex justify-between text-xs font-bold border-t border-b border-black py-1 mb-2 mt-4 clear-both">
          <span>Date of Supply : {formatDateForDisplay(voucherDate)}</span>
          <span>Agent : {voucher.agent || ''}</span>
        </div>

        <table className="w-full text-[10px] text-center border-collapse border border-black font-bold">
          <thead>
            <tr>
              <th className="border border-black p-1 w-8">SNo.</th>
              <th className="border border-black p-1">Description of Goods</th>
              <th className="border border-black p-1 w-16">HSN/SAC</th>
              <th className="border border-black p-1 w-12">Qty.</th>
              <th className="border border-black p-1 w-14">Rate</th>
              <th className="border border-black p-1 w-12">GST</th>
              <th className="border border-black p-1 w-16">Amount</th>
            </tr>
          </thead>
          <tbody>
            {itemsList.map((item, idx) => (
              <tr key={idx}>
                <td className="border-x border-black p-1">{idx + 1}</td>
                <td className="border-x border-black p-1 text-left uppercase">{item.name}</td>
                <td className="border-x border-black p-1">{item.hsnCode}</td>
                <td className="border-x border-black p-1">{item.quantity} SET</td>
                <td className="border-x border-black p-1">{item.rate.toFixed(2)}</td>
                <td className="border-x border-black p-1">{item.gstPercent > 0 ? `${item.gstPercent}%` : '0%'}</td>
                <td className="border-x border-black p-1">{item.amount.toFixed(2)}</td>
              </tr>
            ))}
            {/* Empty rows filler for styling */}
            {[...Array(Math.max(0, 5 - itemsList.length))].map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="border-x border-black p-1 text-transparent">.</td>
                <td className="border-x border-black p-1"></td>
                <td className="border-x border-black p-1"></td>
                <td className="border-x border-black p-1"></td>
                <td className="border-x border-black p-1"></td>
                <td className="border-x border-black p-1"></td>
                <td className="border-x border-black p-1"></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-black">
              <td colSpan="3" className="border-x border-black p-1 text-right">Total</td>
              <td className="border-x border-black p-1">{totalQty} SET</td>
              <td className="border-x border-black p-1"></td>
              <td className="border-x border-black p-1"></td>
              <td className="border-x border-black p-1">{grandTotal.toFixed(2)}</td>
            </tr>
            {isInterState ? (
              <tr>
                <td colSpan="6" className="border-x border-black p-1 text-right">IGST</td>
                <td className="border-x border-black p-1">{igstRateDisplay}</td>
              </tr>
            ) : (
              <>
                <tr>
                  <td colSpan="6" className="border-x border-black p-1 text-right">CGST</td>
                  <td className="border-x border-black p-1">{cgstRateDisplay}</td>
                </tr>
                <tr>
                  <td colSpan="6" className="border-x border-black p-1 text-right">SGST</td>
                  <td className="border-x border-black p-1">{sgstRateDisplay}</td>
                </tr>
              </>
            )}
            <tr className="border-t border-black bg-slate-100">
              <td colSpan="6" className="border-x border-black p-1 text-right text-sm">Grand Total</td>
              <td className="border-x border-black p-1 text-sm font-extrabold">₹{grandTotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="flex justify-between mt-4 text-[10px] font-bold">
          <div className="w-1/2">
            <p className="underline mb-1">Amount in Words :</p>
            <p className="uppercase italic">Rupees {numberToWords(grandTotal)} Only</p>

            <p className="underline mt-4 mb-1">Terms & Conditions :</p>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>Goods once sold will not be taken back.</li>
              <li>Interest @ 18% p.a. will be charged if the payment is not made within the stipulated time.</li>
              <li>Subject to {vendorState || receiverState ? `'${vendorState || receiverState}' ` : ''}Jurisdiction only.</li>
            </ol>
          </div>
          <div className="w-1/3 border border-black p-2 flex flex-col justify-between min-h-[100px]">
            {vendorName ? <p className="text-right">For <span className="text-red-600 font-extrabold uppercase" style={{ fontFamily: '"Times New Roman", Times, serif' }}>{vendorName}</span></p> : null}
            <p className="text-right mt-12">Authorised Signatory</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-4 no-print pb-8">
        <button onClick={handlePrint} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold flex items-center gap-2">
          Print
        </button>
        {handleExportPTExcel && (
          <button onClick={handleExportPTExcel} className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold flex items-center gap-2 shadow transition-all">
            <Download className="w-4 h-4" />
            Download PT File (Excel)
          </button>
        )}
        <button onClick={onDownloadHTML} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2">
          Download HTML
        </button>
        <button onClick={onWhatsAppShare} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-2">
          Share on WhatsApp
        </button>
        <button onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-800 rounded-lg font-bold">
          Import Another PT File
        </button>
      </div>
    </div>
  );
};

