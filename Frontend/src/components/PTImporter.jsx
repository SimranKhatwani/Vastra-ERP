import api from '../api/axios';
import React, { useState, useRef, useMemo } from "react";
import { UploadCloud, CheckCircle2, CheckCircle, XCircle, FileSpreadsheet, Edit3, Save, ArrowLeft, Printer, Download, AlertTriangle, RefreshCw, FileText, Check, ChevronRight, Eye, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";

const FIELDS_TO_MAP = [
  { key: "billNo", label: "Bill No.", required: true, synonyms: ["bill no", "bill no.", "bill number", "invoice no", "invoice no.", "invoice", "invoice number"] },
  { key: "billDate", label: "Bill Date", required: true, synonyms: ["bill date", "date", "invoice date"] },
  { key: "vendorName", label: "Vendor Name", required: true, synonyms: ["vendor name", "vendor", "supplier", "party", "party name", "supplier name"] },
  { key: "vendorGst", label: "Vendor GST", required: false, synonyms: ["vendor gst", "vendor gstin", "gstin", "gst no", "gst number"] },
  { key: "vendorCode", label: "Vendor Code", required: false, synonyms: ["vendor code", "v code", "party code"] },
  { key: "brand", label: "Brand", required: false, synonyms: ["brand", "brand name", "make"] },
  { key: "ipn", label: "IPN", required: false, synonyms: ["ipn", "ipn no"] },
  { key: "designNo", label: "Design No.", required: true, synonyms: ["design no", "design no.", "design", "design number", "article"] },
  { key: "barcode", label: "Barcode", required: false, synonyms: ["barcode", "barcode no", "barcode no.", "bar code"] },
  { key: "itemName", label: "Item Name", required: true, synonyms: ["item name", "item", "product", "product name"] },
  { key: "subCategory", label: "Sub Item Name", required: false, synonyms: ["sub item name", "sub item", "sub category", "sub-category"] },
  { key: "itemCode", label: "Item Code", required: false, synonyms: ["item code", "code", "sku", "product code"] },
  { key: "quantity", label: "Quantity", required: true, synonyms: ["qty", "qty.", "quantity", "pcs", "total qty", "total qty."] },
  { key: "batch", label: "Batch", required: false, synonyms: ["batch"] },
  { key: "topBottomSet", label: "Top / Bottom / Set", required: false, synonyms: ["top/bottom/set", "group 1", "group 1 (top/bottom/set)", "top bottom set", "type"] },
  { key: "gender", label: "Gender", required: false, synonyms: ["gender", "sex"] },
  { key: "colorPrimary", label: "Primary Color", required: false, synonyms: ["color (p)", "color(p)", "colour", "primary color", "color", "colour (p)"] },
  { key: "colorSecondary", label: "Secondary Color", required: false, synonyms: ["color (s)", "color(s)", "secondary color", "colour (s)", "colour(s)"] },
  { key: "size", label: "Size", required: false, synonyms: ["size"] },
  { key: "purchaseRate", label: "Purchase Rate", required: true, synonyms: ["p. rate", "p.rate", "purchase rate", "rate", "purchase price"] },
  { key: "gstOnPurchase", label: "GST on Purchase", required: false, synonyms: ["gst on purchase", "gst", "tax", "tax rate", "gst %"] },
  { key: "typeOfGst", label: "Type of GST (I/E)", required: false, synonyms: ["type of gst", "type of gst (i/e)", "gst type", "gst i/e"] },
  { key: "gstStatus", label: "GST Status", required: false, synonyms: ["gst status", "tax status"] },
  { key: "wspAfterGst", label: "WSP After GST", required: false, synonyms: ["wsp after gst", "wsp", "final rate", "landing cost"] },
  { key: "mrp", label: "MRP", required: false, synonyms: ["mrp", "retail price", "selling price", "sale price"] },
  { key: "gstOnSalePrice", label: "GST on Sale", required: false, synonyms: ["gst on sale", "gst on sale price", "sale gst"] },
  { key: "discountStatus", label: "Discount Status", required: false, synonyms: ["discount status", "discount status (b/a/n)"] },
  { key: "discountOnPurchase", label: "Discount on Purchase", required: false, synonyms: ["dis. on purchase", "discount on purchase", "discount", "disc", "dis."] },
  { key: "hsnCode", label: "HSN Code", required: false, synonyms: ["hsn code", "hsn", "sac code"] },
  { key: "firm", label: "Firm", required: false, synonyms: ["firm", "company", "firm name"] },
  { key: "uniqueCode", label: "Unique Code", required: false, synonyms: ["unique code"] },
  { key: "serialNumber", label: "S.No.", required: false, synonyms: ["s.no.", "s.no", "sr no", "serial", "sno", "serial number", "sl no"] },
  { key: "itemImage", label: "Item Image", required: false, synonyms: ["item image", "image", "photo"] }
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
  const fileInputRef = useRef(null);
  const invoiceRef = useRef(null);

  const processFile = (file) => {
    setIsUploading(true);
    setUploadProgress(10);
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
        
        // Extract Vendor Data sheet if present
        const vendorSheetName = wb.SheetNames.find(n => n.toLowerCase().trim() === 'vendor data');
        if (vendorSheetName) {
           const vSheet = wb.Sheets[vendorSheetName];
           const vData = XLSX.utils.sheet_to_json(vSheet, { defval: "" }); 
           setVendorDataRows(vData);
        } else {
           setVendorDataRows([]);
        }

        const hdrs = data[0].map(h => String(h || "").trim());
        setHeaders(hdrs);
        const rows = data.slice(1).filter(r => r.some(cell => cell !== undefined && cell !== ""));
        setRawRows(rows);
        let initialMapping = {};
        const usedCols = new Set(); // prevent double-mapping

        // Pass 1: Exact match on field key or label
        FIELDS_TO_MAP.forEach(field => {
          const matchIdx = hdrs.findIndex((h, i) => !usedCols.has(i) && (h.toLowerCase() === field.key.toLowerCase() || h.toLowerCase() === field.label.toLowerCase()));
          if (matchIdx !== -1) { initialMapping[field.key] = matchIdx; usedCols.add(matchIdx); }
        });

        // Pass 2: Exact synonym match
        FIELDS_TO_MAP.forEach(field => {
          if (initialMapping[field.key] !== undefined) return;
          const matchIdx = hdrs.findIndex((h, i) => !usedCols.has(i) && field.synonyms.some(syn => h.toLowerCase() === syn.toLowerCase()));
          if (matchIdx !== -1) { initialMapping[field.key] = matchIdx; usedCols.add(matchIdx); }
        });

        // Pass 3: Partial (includes) synonym match — only for synonyms with 4+ chars to avoid false positives
        FIELDS_TO_MAP.forEach(field => {
          if (initialMapping[field.key] !== undefined) return;
          const matchIdx = hdrs.findIndex((h, i) => !usedCols.has(i) && field.synonyms.some(syn => syn.length >= 4 && h.toLowerCase().includes(syn.toLowerCase())));
          if (matchIdx !== -1) { initialMapping[field.key] = matchIdx; usedCols.add(matchIdx); }
        });

        setColumnMapping(initialMapping);
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setStep("mapping");
          if (onAddNotification) onAddNotification("Success", "Excel parsed. Review column mappings.", "success");
        }, 500);
      } catch (err) {
        setIsUploading(false);
        if (onAddNotification) onAddNotification("Parsing Failed", "Error parsing Excel spreadsheet content.", "danger");
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmMapping = () => {
    const unmappedRequired = FIELDS_TO_MAP.filter(f => f.required && columnMapping[f.key] === undefined && !globalValues[f.key]);
    if (unmappedRequired.length > 0) {
      if (onAddNotification) onAddNotification("Mapping Required", `Please map or provide a value for required fields: ${unmappedRequired.map(f => f.label).join(", ")}`, "warning");
      return;
    }
    const parsed = rawRows.map((rawRow, idx) => {
      const getVal = (key) => {
        const colIdx = columnMapping[key];
        if (colIdx !== undefined) {
            const val = rawRow[colIdx];
            if (val !== undefined && val !== null && String(val).trim() !== "") return String(val).trim();
        }
        if (globalValues[key]) return globalValues[key];
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
        // Try Excel serial number (pure number > 10000)
        const num = parseFloat(str);
        if (!isNaN(num) && num > 10000 && str.match(/^\d+(\.\d+)?$/)) {
          const utc_days = Math.floor(num - 25569);
          const utc_value = utc_days * 86400;
          const date_info = new Date(utc_value * 1000);
          return date_info.toISOString().split("T")[0];
        }
        // Try DD-MM-YYYY or DD/MM/YYYY
        const ddmmyyyy = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
        if (ddmmyyyy) {
          const [, dd, mm, yyyy] = ddmmyyyy;
          return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        }
        // Try YYYY-MM-DD (already ISO)
        const iso = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
        if (iso) {
          const [, yyyy, mm, dd] = iso;
          return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        }
        // Fallback: try native Date parsing
        const d = new Date(str);
        if (!isNaN(d.getTime()) && d.getFullYear() > 1970) {
          return d.toISOString().split("T")[0];
        }
        return str;
      };

      const billNo = getVal("billNo");
      const billDate = formatExcelDate(getVal("billDate")) || new Date().toISOString().split("T")[0];
      const vendorName = getVal("vendorName");
      const brand = getVal("brand");
      const designNo = getVal("designNo");
      const serialNumber = getVal("serialNumber");
      const barcode = getVal("barcode");
      const itemCode = getVal("itemCode") || `ITEM-${designNo}`;
      const itemName = getVal("itemName");
      const subCategory = getVal("subCategory");
      const quantity = getNum("quantity") || 1;
      const batch = getVal("batch");
      const topBottomSet = getVal("topBottomSet");
      const gender = getVal("gender");
      const colorPrimary = getVal("colorPrimary");
      const colorSecondary = getVal("colorSecondary");
      const size = getVal("size");
      const purchaseRate = getNum("purchaseRate");
      const mrp = getNum("mrp");
      const hsnCode = getVal("hsnCode");
      const gstOnPurchase = getNum("gstOnPurchase");
      const gstOnSalePrice = getNum("gstOnSalePrice");
      const firm = getVal("firm");
      const uniqueCode = getVal("uniqueCode");
      const typeOfGst = getVal("typeOfGst") || "E";
      const discountStatus = getVal("discountStatus") || "N";
      const discountOnPurchase = getNum("discountOnPurchase");

      let wspAfterGst = getNum("wspAfterGst");
      if (!wspAfterGst) {
          wspAfterGst = typeOfGst.toUpperCase() === "E" ? purchaseRate + (purchaseRate * (gstOnPurchase / 100)) : purchaseRate;
      }

      return {
        tempId: `row-${idx}-${Date.now()}`,
        billNo, billDate, vendorName, brand, designNo, serialNumber, barcode, itemCode, itemName, subCategory, quantity, batch, topBottomSet, gender, colorPrimary, colorSecondary, size, purchaseRate, mrp, hsnCode, gstOnPurchase, gstOnSalePrice, firm, uniqueCode, typeOfGst, wspAfterGst, discountStatus, discountOnPurchase,
        errors: [], warnings: [], status: "valid", resolution: "none"
      };
    });
    validateRows(parsed);
    setStep("preview");
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
    if (field === "quantity" || field === "purchaseRate" || field === "gstOnPurchase") {
      updated[index][field] = parseFloat(value) || 0;
    } else {
      updated[index][field] = value;
    }
    validateRows(updated);
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
    setImportLoaderMessage("Import completed successfully. Preparing Purchase Voucher... Please wait.");

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


      const firstRow = parsedRows[0];
      const supplierObj = currentSuppliers.find(s => s.name?.toLowerCase() === firstRow.vendorName?.toLowerCase());
      
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
        supplierName: firstRow.vendorName,
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

      await new Promise(resolve => setTimeout(resolve, 500));

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
        <title>Invoice - ${createdVoucher.invoiceNo}</title>
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
    link.download = `Invoice-${createdVoucher.invoiceNo}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleWhatsAppShare = () => {
    if (!createdVoucher) return;
    const text = `*K.R. Chhabra & Co. - Tax Invoice*\n\nInvoice No: ${createdVoucher.invoiceNo}\nDate: ${createdVoucher.date}\nBilled To: ${createdVoucher.supplierName}\nTotal Amount: Rs ${createdVoucher.grandTotal.toFixed(2)}\n\nPlease review your invoice.`;
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
              {importLoaderMessage || "Import completed successfully. Preparing Purchase Voucher... Please wait."}
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 w-full text-left space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Creating Purchase Voucher & Bill</span>
                <span className="text-emerald-600 font-bold">Complete</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" /> Generating Barcodes & Inventory</span>
                <span className="text-purple-600 font-bold">Processing</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-blue-500" /> Updating Procurement Table & Dashboard</span>
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
          <h2 className="text-xl font-black text-slate-800 tracking-tight">PT File Importer (27 Columns)</h2>
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

      {step === "mapping" && (
        <div className="p-6">
            <div className="flex justify-between mb-4">
                <h3 className="text-lg font-bold">Map Columns</h3>
                <button onClick={handleConfirmMapping} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold">Confirm Mapping</button>
            </div>
            <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2">
                {FIELDS_TO_MAP.map((field) => (
                    <div key={field.key} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="text-xs font-semibold w-1/3 truncate" title={field.label}>{field.label} {field.required && <span className="text-red-500">*</span>}</div>
                        <div className="flex items-center gap-2 w-2/3">
                            <select
                                value={columnMapping[field.key] !== undefined ? columnMapping[field.key] : ""}
                                onChange={(e) => setColumnMapping({ ...columnMapping, [field.key]: e.target.value !== "" ? parseInt(e.target.value) : undefined })}
                                className="text-xs p-1.5 border rounded-lg bg-white outline-none flex-1 min-w-0"
                            >
                                <option value="">- Column -</option>
                                {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                            </select>
                            <span className="text-[10px] text-slate-400 font-bold">OR</span>
                            <input 
                                type={field.key.toLowerCase().includes("date") ? "date" : "text"} 
                                placeholder="Fixed Value" 
                                value={globalValues[field.key] || ""} 
                                onChange={(e) => setGlobalValues({...globalValues, [field.key]: e.target.value})}
                                className="text-xs p-1.5 border rounded-lg bg-white outline-none flex-1 min-w-0" 
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {step === "preview" && (
          <div className="p-6">
            <div className="flex justify-between mb-4">
                <h3 className="text-lg font-bold">Review Data</h3>
                <button 
                  onClick={handleImportPTFileSubmit} 
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-white rounded-lg font-bold ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600'}`}
                >
                  {isSubmitting ? 'Compiling & Saving...' : 'Compile & Save Vouchers'}
                </button>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 uppercase font-bold">
                        <tr>
                            <th className="p-3">Status</th>
                            <th className="p-3">Vendor</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Bill No</th>
                            <th className="p-3">Item Name</th>
                            <th className="p-3">Design No</th>
                            <th className="p-3">Qty</th>
                            <th className="p-3">Pur. Rate</th>
                            <th className="p-3">GST %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {parsedRows.map((r, i) => (
                            <tr key={i} className="border-t border-slate-100">
                                <td className="p-3">{r.status === "error" ? <XCircle className="text-red-500 w-4 h-4"/> : <CheckCircle2 className="text-emerald-500 w-4 h-4"/>}</td>
                                <td className="p-1"><input value={r.vendorName} onChange={(e) => handleRowChange(i, 'vendorName', e.target.value)} className="w-24 p-1 border rounded" /></td>
                                <td className="p-1"><input type="date" value={r.billDate} onChange={(e) => handleRowChange(i, 'billDate', e.target.value)} className="w-28 p-1 border rounded" /></td>
                                <td className="p-1"><input value={r.billNo} onChange={(e) => handleRowChange(i, 'billNo', e.target.value)} className="w-20 p-1 border rounded" /></td>
                                <td className="p-1"><input value={r.itemName} onChange={(e) => handleRowChange(i, 'itemName', e.target.value)} className="w-24 p-1 border rounded" /></td>
                                <td className="p-1"><input value={r.designNo} onChange={(e) => handleRowChange(i, 'designNo', e.target.value)} className="w-20 p-1 border rounded" /></td>
                                <td className="p-1"><input type="number" value={r.quantity} onChange={(e) => handleRowChange(i, 'quantity', e.target.value)} className="w-16 p-1 border rounded" /></td>
                                <td className="p-1"><input type="number" value={r.purchaseRate} onChange={(e) => handleRowChange(i, 'purchaseRate', e.target.value)} className="w-20 p-1 border rounded" /></td>
                                <td className="p-1"><input type="number" value={r.gstOnPurchase} onChange={(e) => handleRowChange(i, 'gstOnPurchase', e.target.value)} className="w-16 p-1 border rounded" /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
      )}

      {step === "success" && createdVoucher && (
          <InvoiceViewer 
             createdVoucher={createdVoucher}
             invoiceRef={invoiceRef}
             handlePrint={() => window.print()}
             handleDownloadHTML={handleDownloadHTML}
             handleWhatsAppShare={handleWhatsAppShare}
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

export const InvoiceViewer = ({ createdVoucher = {}, invoiceRef, handlePrint, handleDownloadHTML, handleWhatsAppShare, onClose }) => {
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

  // Extract Vendor / Supplier Name
  const supplierName =
    voucher.supplierName ||
    voucher.vendorName ||
    voucher.supplier?.name ||
    voucher.vendorId?.name ||
    voucher.vendorId?.businessName ||
    voucher.vendor?.name ||
    (typeof voucher.vendor === "string" ? voucher.vendor : null) ||
    (typeof voucher.supplier === "string" ? voucher.supplier : null) ||
    "Wholesaler / Vendor";

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
  const voucherDate = voucher.date || voucher.billDate || voucher.createdAt || voucher.createdDate || new Date();

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
    const supplierNameStr = voucher.supplierName || voucher.vendorName || voucher.supplier?.name || voucher.vendorId?.name || "";
    const fallbackName = supplierNameStr
      ? `FANCY EMBROIDERED COTTON SUITS (${supplierNameStr})`
      : `FANCY EMBROIDERED COTTON SUITS (INV ${invoiceNo})`;
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
      return {
        id: idx,
        name: item,
        hsnCode: "5208",
        quantity: Number(voucher.quantity || voucher.qty || 1),
        rate: Number(voucher.purchaseRate || voucher.rate || voucher.purchasePrice || 0),
        amount: Number(voucher.grandTotal || voucher.subTotal || 0)
      };
    }
    const name = item.name || item.itemName || item.productName || item.title || item.itemCode || (item.designNo ? `Design ${item.designNo}` : `Garment Item #${idx + 1}`);
    const hsnCode = item.hsnCode || item.hsn || item.sac || "5208";
    const quantity = Number(item.quantity ?? item.qty ?? item.count ?? 1);
    const rate = Number(item.purchaseRate ?? item.purchasePrice ?? item.rate ?? item.price ?? item.mrp ?? 0);
    const amount = Number(item.calculatedTaxable ?? item.totalPrice ?? item.lineTotal ?? item.amount ?? (quantity * rate));
    return {
      id: idx,
      name,
      hsnCode,
      quantity,
      rate,
      amount
    };
  });

  // Financial Calculations
  const totalQty = itemsList.reduce((acc, item) => acc + (item.quantity || 0), 0);
  const calculatedSubTotal = itemsList.reduce((acc, item) => acc + (item.amount || 0), 0);
  
  const subTotal = Number(voucher.subTotal ?? calculatedSubTotal);
  const rawGrandTotal = Number(voucher.grandTotal ?? voucher.totalAmount ?? voucher.amount ?? (subTotal + (Number(voucher.gstTotal) || 0)));
  const grandTotal = isNaN(rawGrandTotal) ? subTotal : rawGrandTotal;

  const rawGst = Number(voucher.gstTotal ?? voucher.gst ?? (grandTotal - subTotal));
  const gstTotal = isNaN(rawGst) ? Math.max(0, grandTotal - subTotal) : rawGst;
  const cgst = gstTotal / 2;
  const sgst = gstTotal / 2;

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
          <div className="text-center mb-4 border-b-2 border-red-600 pb-2">
              <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                  <span>GSTIN : 07ACAPC2634E1ZB</span>
                  <div className="text-right">
                      <span className="text-blue-600 block">Contact : Saurabh : 92108 20005</span>
                      <span className="text-red-600 block">Sunny # : 96546 57012</span>
                  </div>
              </div>
              
              <h1 className="text-5xl font-bold text-red-600 tracking-wider" style={{ fontFamily: '"Times New Roman", Times, serif' }}>K.R. Chhabra & Co.</h1>
              <p className="text-sm text-green-700 italic mt-1 font-semibold">A latest Trend of Design</p>
              
              <div className="bg-blue-800 text-white inline-block px-6 py-1 mt-3 mb-2 rounded-sm text-lg font-bold tracking-widest shadow-sm">
                  FANCY EMBROIDRIES COTTON SUITS
              </div>
              
              <div className="text-xs font-bold text-slate-800">
                  <p>Head Office : 773, Gali Taliya Katra Neel, Chandni Chowk, Delhi-110006 Ph. : Shop : 011-42478096 # MANOJ JI : 96430 85400</p>
                  <p className="text-red-600 mt-1 border-t border-slate-300 pt-1">Sale Office : 768, Ground Floor, Main Katra Neel, Chandni Chowk, Delhi-110006</p>
              </div>
          </div>
          <div className="text-center mb-6">
              <span className="inline-block border border-black px-6 py-1 italic font-bold text-sm tracking-wide">TAX INVOICE</span>
          </div>

          <div className="flex justify-between mb-4 text-xs font-bold">
              <div className="w-1/2">
                  <p className="border-b border-black inline-block mb-1">Details of Receiver | Billed To</p>
                  <p>Name : <span className="ml-2 uppercase">{supplierName}</span></p>
                  <p>GSTIN : <span className="ml-2">07AALPD0185E1Z1</span></p>
                  <p className="flex"><span className="mr-2">Address :</span> <span className="uppercase">W Z 127, RAM CHOWK ,<br/>SADH NAGAR, PALAM COLONY ,<br/>NEW DELHI .</span></p>
                  <p>State Name : <span className="uppercase">DELHI</span> <span className="ml-6">State Code : 07</span></p>
                  <p>Transport : <span className="uppercase">SELF AMIT</span></p>
              </div>
              <div className="w-1/2 text-right">
                  <p>Page No. 1 of 1</p>
                  <p className="mt-4">Invoice No. <span className="font-extrabold text-base ml-2">{invoiceNo}</span> <span className="ml-4">Date {formatDateForDisplay(voucherDate)}</span></p>
                  <p className="mt-1">State Name : DELHI <span className="ml-4">State Code 07</span></p>
                  <div className="mt-3 text-[10px] max-w-[250px] float-right leading-tight text-right">
                     <span className="font-bold text-slate-800 mr-1">IRN No:</span>
                     <span className="break-all text-slate-700">3afefab242d6f9fccb064bee6285ed7a23a9d9c19eb98230cdd1a288eff77f0e</span>
                  </div>
              </div>
          </div>

          <div className="w-full flex justify-between text-xs font-bold border-t border-b border-black py-1 mb-2 mt-4 clear-both">
              <span>Date of Supply : {formatDateForDisplay(voucherDate)}</span>
              <span>Agent : </span>
          </div>

          <table className="w-full text-[10px] text-center border-collapse border border-black font-bold">
              <thead>
                  <tr>
                      <th className="border border-black p-1 w-8">SNo.</th>
                      <th className="border border-black p-1">Description of Goods</th>
                      <th className="border border-black p-1 w-16">HSN/SAC</th>
                      <th className="border border-black p-1 w-12">Qty.</th>
                      <th className="border border-black p-1 w-12">Rate</th>
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
                      </tr>
                  ))}
              </tbody>
              <tfoot>
                  <tr className="border-t border-black">
                      <td colSpan="3" className="border-x border-black p-1 text-right">Total</td>
                      <td className="border-x border-black p-1">{totalQty} SET</td>
                      <td className="border-x border-black p-1"></td>
                      <td className="border-x border-black p-1">{subTotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                      <td colSpan="5" className="border-x border-black p-1 text-right">CGST</td>
                      <td className="border-x border-black p-1">{cgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                      <td colSpan="5" className="border-x border-black p-1 text-right">SGST</td>
                      <td className="border-x border-black p-1">{sgst.toFixed(2)}</td>
                  </tr>
                  <tr className="border-t border-black bg-slate-100">
                      <td colSpan="5" className="border-x border-black p-1 text-right text-sm">Grand Total</td>
                      <td className="border-x border-black p-1 text-sm">₹{grandTotal.toFixed(2)}</td>
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
                      <li>Subject to 'Delhi' Jurisdiction only.</li>
                  </ol>
              </div>
              <div className="w-1/3 border border-black p-2 flex flex-col justify-between min-h-[100px]">
                  <p className="text-right">For <span className="text-red-600 font-extrabold" style={{ fontFamily: '"Times New Roman", Times, serif' }}>K.R. Chhabra & Co.</span></p>
                  <p className="text-right mt-12">Authorised Signatory</p>
              </div>
          </div>
       </div>

       <div className="mt-8 flex justify-center gap-4 no-print pb-8">
           <button onClick={handlePrint} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold flex items-center gap-2">
               Print
           </button>
           <button onClick={handleDownloadHTML} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2">
               Download HTML
           </button>
           <button onClick={handleWhatsAppShare} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-2">
               Share on WhatsApp
           </button>
           <button onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-800 rounded-lg font-bold">
               Import Another PT File
           </button>
       </div>
    </div>
  );
};
