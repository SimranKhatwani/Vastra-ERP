import React, { useState, useRef, useMemo } from "react";
import { UploadCloud, CheckCircle2, XCircle, FileSpreadsheet, Edit3, Save, ArrowLeft, Printer, Download, AlertTriangle, RefreshCw, FileText, Check, ChevronRight, Eye, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";

const FIELDS_TO_MAP = [
  { key: "billNo", label: "Bill No.", required: true, synonyms: ["bill no", "invoice no", "invoice"] },
  { key: "billDate", label: "Bill Date", required: true, synonyms: ["bill date", "date", "invoice date"] },
  { key: "vendorName", label: "Vendor Name", required: true, synonyms: ["vendor", "supplier", "party"] },
  { key: "brand", label: "Brand", required: false, synonyms: ["brand", "make"] },
  { key: "designNo", label: "Design No.", required: true, synonyms: ["design", "design no", "design number", "article"] },
  { key: "serialNumber", label: "Serial Number", required: false, synonyms: ["sr no", "serial", "sno"] },
  { key: "barcode", label: "Barcode", required: false, synonyms: ["barcode"] },
  { key: "itemCode", label: "Item Code", required: true, synonyms: ["item code", "code"] },
  { key: "itemName", label: "Item Name", required: true, synonyms: ["item name", "item", "product"] },
  { key: "subCategory", label: "Sub Category", required: false, synonyms: ["sub category", "sub-category"] },
  { key: "quantity", label: "Quantity", required: true, synonyms: ["qty", "quantity", "pcs"] },
  { key: "batch", label: "Batch", required: false, synonyms: ["batch"] },
  { key: "topBottomSet", label: "Top / Bottom / Set", required: false, synonyms: ["top/bottom/set", "set", "type"] },
  { key: "gender", label: "Gender", required: false, synonyms: ["gender", "sex"] },
  { key: "colorPrimary", label: "Primary Color", required: false, synonyms: ["color", "colour", "primary color"] },
  { key: "colorSecondary", label: "Secondary Color", required: false, synonyms: ["secondary color"] },
  { key: "size", label: "Size", required: false, synonyms: ["size"] },
  { key: "purchaseRate", label: "Purchase Rate", required: true, synonyms: ["p. rate", "rate", "purchase price", "wsp"] },
  { key: "mrp", label: "MRP", required: true, synonyms: ["mrp", "retail price"] },
  { key: "hsnCode", label: "HSN Code", required: true, synonyms: ["hsn", "hsn code"] },
  { key: "gstOnPurchase", label: "GST on Purchase", required: true, synonyms: ["gst", "gst on purchase", "tax"] },
  { key: "gstOnSalePrice", label: "GST on Sale Price", required: false, synonyms: ["gst on sale"] },
  { key: "firm", label: "Firm", required: true, synonyms: ["firm", "company"] },
  { key: "uniqueCode", label: "Unique Code", required: false, synonyms: ["unique code"] },
  { key: "typeOfGst", label: "Type of GST (I / E)", required: true, synonyms: ["type of gst", "gst type"] },
  { key: "wspAfterGst", label: "WSP AFTER GST", required: false, synonyms: ["wsp after gst", "final rate"] },
  { key: "discountStatus", label: "Discount Status", required: true, synonyms: ["discount status", "status"] },
  { key: "discountOnPurchase", label: "Discount on Purchase", required: false, synonyms: ["discount", "disc"] }
];

export const PTImporter = ({ products, setProducts, suppliers, setSuppliers, purchaseOrders, onAddPurchaseOrder, onAddNotification, onClose }) => {
  const [step, setStep] = useState("upload");
  const [rawRows, setRawRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [globalValues, setGlobalValues] = useState({});
  const [parsedRows, setParsedRows] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
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
        const hdrs = data[0].map(h => String(h || "").trim());
        setHeaders(hdrs);
        const rows = data.slice(1).filter(r => r.some(cell => cell !== undefined && cell !== ""));
        setRawRows(rows);
        let initialMapping = {};
        FIELDS_TO_MAP.forEach(field => {
          let matchIdx = hdrs.findIndex(h => h.toLowerCase() === field.key.toLowerCase() || h.toLowerCase() === field.label.toLowerCase());
          if (matchIdx === -1) matchIdx = hdrs.findIndex(h => field.synonyms.some(syn => h.toLowerCase() === syn.toLowerCase() || h.toLowerCase().includes(syn.toLowerCase())));
          if (matchIdx !== -1) initialMapping[field.key] = matchIdx;
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

      const formatExcelDate = (serial) => {
        if (!serial) return "";
        if (isNaN(serial)) return String(serial).trim();
        const num = parseFloat(serial);
        const utc_days  = Math.floor(num - 25569);
        const utc_value = utc_days * 86400;                                        
        const date_info = new Date(utc_value * 1000);
        return date_info.toISOString().split("T")[0];
      };

      const billNo = getVal("billNo");
      const billDate = formatExcelDate(getVal("billDate")) || new Date().toISOString().split("T")[0];
      const vendorName = getVal("vendorName");
      const brand = getVal("brand");
      const designNo = getVal("designNo");
      const serialNumber = getVal("serialNumber");
      const barcode = getVal("barcode");
      const itemCode = getVal("itemCode");
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
      if (!row.itemCode) errors.push("Item Code is missing");
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

  const handleImportPTFileSubmit = () => {
    const errorCount = parsedRows.filter(r => r.status === "error").length;
    if (errorCount > 0) {
      if (onAddNotification) onAddNotification("Import Blocked", "Please resolve errors first.", "danger");
      return;
    }
    
    // Auto-create suppliers
    let currentSuppliers = [...(suppliers || [])];
    const uniqueVendors = Array.from(new Set(parsedRows.map(r => r.vendorName)));
    uniqueVendors.forEach(vendor => {
      if (!currentSuppliers.some(s => s.name?.toLowerCase() === vendor.toLowerCase())) {
        currentSuppliers.push({ 
          id: `sup-${Date.now()}`, 
          name: vendor, 
          status: "Active",
          totalOrders: 0,
          outstandingBalance: 0,
          contactPerson: "N/A",
          gstin: "N/A",
          phone: "N/A",
          email: "N/A"
        });
      }
    });
    if(setSuppliers) setSuppliers(currentSuppliers);

    // Expand items by quantity so each barcode is unique
    let currentProducts = [...(products || [])];
    const billItems = [];
    
    let subTotal = 0;
    let gstTotal = 0;
    let grandDisc = 0;
    
    parsedRows.forEach((row) => {
        // Compute total values for the bill
        const qty = row.quantity;
        const rate = row.purchaseRate;
        const itemSubTotal = qty * rate;
        
        let itemGst = 0;
        let taxable = itemSubTotal;
        let discAmt = row.discountOnPurchase || 0;
        
        if (row.typeOfGst?.toUpperCase() === "I") {
            // Inclusive GST
            const baseRate = rate / (1 + (row.gstOnPurchase / 100));
            taxable = qty * baseRate;
            itemGst = itemSubTotal - taxable;
        } else {
            // Exclusive GST
            itemGst = (taxable - discAmt) * (row.gstOnPurchase / 100);
        }

        subTotal += taxable;
        gstTotal += itemGst;
        grandDisc += discAmt;

        const baseProductId = `prod-${Date.now()}-${Math.random()}`;
        
        billItems.push({
            ...row,
            productId: baseProductId,
            name: `${row.itemName} (${row.designNo})`,
            calculatedTaxable: taxable,
            calculatedGst: itemGst,
            calculatedTotal: taxable - discAmt + itemGst,
            calculatedDisc: discAmt
        });

        // Insert products into db (simulated)
        for(let i=0; i<qty; i++) {
            const uniqueBarcode = row.barcode || `BCODE${Math.floor(10000000 + Math.random() * 90000000)}`;
            currentProducts.push({
                id: i === 0 ? baseProductId : `prod-${Date.now()}-${Math.random()}`,
                name: `${row.itemName} (${row.designNo})`,
                category: row.itemName,
                brand: row.brand,
                sku: `${row.designNo}-${uniqueBarcode}`,
                barcode: uniqueBarcode,
                itemCode: row.itemCode,
                color: row.colorPrimary,
                size: row.size,
                purchasePrice: row.wspAfterGst,
                sellingPrice: row.mrp,
                mrp: row.mrp,
                gstPercent: row.gstOnSalePrice || row.gstOnPurchase,
                stock: 1, // EXACTLY 1 per barcode
                status: "In Stock"
            });
        }
    });

    if(setProducts) setProducts(currentProducts);

    const firstRow = parsedRows[0];
    const supplierObj = currentSuppliers.find(s => s.name?.toLowerCase() === firstRow.vendorName?.toLowerCase());
    
    const newVoucher = {
      id: `po-${Date.now()}`,
      poNo: firstRow.billNo,
      invoiceNo: firstRow.billNo,
      date: firstRow.billDate,
      supplierId: supplierObj ? (supplierObj._id || supplierObj.id) : `sup-${Date.now()}`,
      supplierName: firstRow.vendorName,
      items: billItems,
      subTotal: subTotal,
      gstTotal: gstTotal,
      grandTotal: subTotal - grandDisc + gstTotal,
      status: "Completed"
    };
    
    if (onAddPurchaseOrder) onAddPurchaseOrder(newVoucher);
    setCreatedVoucher(newVoucher);
    setStep("success");
    if (onAddNotification) onAddNotification("Import Complete", "Successfully parsed 27-column PT File and generated unique barcodes!", "success");
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
      {onClose && step !== "success" && (
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
                <button onClick={handleImportPTFileSubmit} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold">Compile & Save Vouchers</button>
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
             onClose={() => setStep("upload")}
          />
      )}
    </div>
  );
};

export const InvoiceViewer = ({ createdVoucher, invoiceRef, handlePrint, handleDownloadHTML, handleWhatsAppShare, onClose }) => {
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

  const internalRef = React.useRef(null);
  const activeRef = invoiceRef || internalRef;

  return (
    <div className="p-8 bg-slate-50 min-h-screen relative">
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
                  <p>Name : <span className="ml-2 uppercase">{createdVoucher.supplierName}</span></p>
                  <p>GSTIN : <span className="ml-2">07AALPD0185E1Z1</span></p>
                  <p className="flex"><span className="mr-2">Address :</span> <span className="uppercase">W Z 127, RAM CHOWK ,<br/>SADH NAGAR, PALAM COLONY ,<br/>NEW DELHI .</span></p>
                  <p>State Name : <span className="uppercase">DELHI</span> <span className="ml-6">State Code : 07</span></p>
                  <p>Transport : <span className="uppercase">SELF AMIT</span></p>
              </div>
              <div className="w-1/2 text-right">
                  <p>Page No. 1 of 1</p>
                  <p className="mt-4">Invoice No. <span className="font-extrabold text-base ml-2">{createdVoucher.poNo || createdVoucher.invoiceNo}</span> <span className="ml-4">Date {formatDateForDisplay(createdVoucher.date)}</span></p>
                  <p className="mt-1">State Name : DELHI <span className="ml-4">State Code 07</span></p>
                  <div className="mt-3 text-[10px] max-w-[250px] float-right leading-tight text-right">
                     <span className="font-bold text-slate-800 mr-1">IRN No:</span>
                     <span className="break-all text-slate-700">3afefab242d6f9fccb064bee6285ed7a23a9d9c19eb98230cdd1a288eff77f0e</span>
                  </div>
              </div>
          </div>

          <div className="w-full flex justify-between text-xs font-bold border-t border-b border-black py-1 mb-2 mt-4 clear-both">
              <span>Date of Supply : {formatDateForDisplay(createdVoucher.date)}</span>
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
                  {createdVoucher.items?.map((item, idx) => (
                      <tr key={idx}>
                          <td className="border-x border-black p-1">{idx + 1}</td>
                          <td className="border-x border-black p-1 text-left uppercase">{item.name || item.itemName}</td>
                          <td className="border-x border-black p-1">{item.hsnCode || "5208"}</td>
                          <td className="border-x border-black p-1">{item.quantity} SET</td>
                          <td className="border-x border-black p-1">{item.purchaseRate || item.purchasePrice}</td>
                          <td className="border-x border-black p-1">{item.calculatedTaxable || item.totalPrice}</td>
                      </tr>
                  ))}
                  {/* Empty rows filler for styling */}
                  {[...Array(Math.max(0, 5 - (createdVoucher.items?.length || 0)))].map((_, i) => (
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
                      <td className="border-x border-black p-1">{createdVoucher.items?.reduce((s, i) => s + (i.quantity || 0), 0)} SET</td>
                      <td className="border-x border-black p-1"></td>
                      <td className="border-x border-black p-1">{createdVoucher.subTotal?.toFixed(2)}</td>
                  </tr>
                  <tr>
                      <td colSpan="5" className="border-x border-black p-1 text-right">CGST</td>
                      <td className="border-x border-black p-1">{(createdVoucher.gstTotal / 2)?.toFixed(2)}</td>
                  </tr>
                  <tr>
                      <td colSpan="5" className="border-x border-black p-1 text-right">SGST</td>
                      <td className="border-x border-black p-1">{(createdVoucher.gstTotal / 2)?.toFixed(2)}</td>
                  </tr>
                  <tr className="border-t border-black bg-slate-100">
                      <td colSpan="5" className="border-x border-black p-1 text-right text-sm">Grand Total</td>
                      <td className="border-x border-black p-1 text-sm">₹{createdVoucher.grandTotal?.toFixed(2)}</td>
                  </tr>
              </tfoot>
          </table>

          <div className="flex justify-between mt-4 text-[10px] font-bold">
              <div className="w-1/2">
                  <p className="underline mb-1">Amount in Words :</p>
                  <p className="uppercase italic">Rupees {Math.round(createdVoucher.grandTotal)} Only</p>
                  
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
