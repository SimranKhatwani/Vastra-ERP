const fs = require('fs');
const filepath = "c:/Users/BAPS/Downloads/GarmentERP/Frontend/src/components/PTImporter.jsx";

const code = `import React, { useState, useRef, useMemo } from "react";
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

export const PTImporter = ({ products, setProducts, suppliers, setSuppliers, purchaseOrders, setPurchaseOrders, onAddNotification }) => {
  const [step, setStep] = useState("upload");
  const [rawRows, setRawRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [parsedRows, setParsedRows] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [createdVoucher, setCreatedVoucher] = useState(null);
  const fileInputRef = useRef(null);

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
    const unmappedRequired = FIELDS_TO_MAP.filter(f => f.required && columnMapping[f.key] === undefined);
    if (unmappedRequired.length > 0) {
      if (onAddNotification) onAddNotification("Mapping Required", \`Please map required fields: \${unmappedRequired.map(f => f.label).join(", ")}\`, "warning");
      return;
    }
    const parsed = rawRows.map((rawRow, idx) => {
      const getVal = (key) => {
        const colIdx = columnMapping[key];
        if (colIdx === undefined) return "";
        const val = rawRow[colIdx];
        return val === undefined || val === null ? "" : String(val).trim();
      };
      const getNum = (key) => {
        const val = getVal(key);
        if (!val) return 0;
        const parsedNum = parseFloat(String(val).replace(/[^0-9.-]/g, ""));
        return isNaN(parsedNum) ? 0 : parsedNum;
      };

      const billNo = getVal("billNo");
      const billDate = getVal("billDate") || new Date().toISOString().split("T")[0];
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
        tempId: \`row-\${idx}-\${Date.now()}\`,
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
        currentSuppliers.push({ id: \`sup-\${Date.now()}\`, name: vendor, status: "Active" });
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

        billItems.push({
            ...row,
            calculatedTaxable: taxable,
            calculatedGst: itemGst,
            calculatedTotal: taxable - discAmt + itemGst,
            calculatedDisc: discAmt
        });

        // Insert products into db (simulated)
        for(let i=0; i<qty; i++) {
            const uniqueBarcode = row.barcode || \`BCODE\${Math.floor(10000000 + Math.random() * 90000000)}\`;
            currentProducts.push({
                id: \`prod-\${Date.now()}-\${Math.random()}\`,
                name: \`\${row.itemName} (\${row.designNo})\`,
                category: row.itemName,
                brand: row.brand,
                sku: \`\${row.designNo}-\${uniqueBarcode}\`,
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
    const newVoucher = {
      id: \`po-\${Date.now()}\`,
      invoiceNo: firstRow.billNo,
      date: firstRow.billDate,
      supplierName: firstRow.vendorName,
      items: billItems,
      subTotal: subTotal,
      gstTotal: gstTotal,
      grandTotal: subTotal - grandDisc + gstTotal,
      status: "Completed"
    };
    
    if(setPurchaseOrders) setPurchaseOrders([...(purchaseOrders || []), newVoucher]);
    setCreatedVoucher(newVoucher);
    setStep("success");
    if (onAddNotification) onAddNotification("Import Complete", "Successfully parsed 27-column PT File and generated unique barcodes!", "success");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-slate-100 bg-slate-50 gap-4">
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
                        <div className="text-xs font-semibold">{field.label} {field.required && <span className="text-red-500">*</span>}</div>
                        <select
                            value={columnMapping[field.key] !== undefined ? columnMapping[field.key] : ""}
                            onChange={(e) => setColumnMapping({ ...columnMapping, [field.key]: e.target.value !== "" ? parseInt(e.target.value) : undefined })}
                            className="text-xs p-1.5 border rounded-lg bg-white outline-none w-1/2"
                        >
                            <option value="">-- Select Column --</option>
                            {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                        </select>
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
                            <th className="p-3">Item Name</th>
                            <th className="p-3">Design No</th>
                            <th className="p-3">Qty</th>
                            <th className="p-3">Purchase Rate</th>
                            <th className="p-3">GST %</th>
                            <th className="p-3">Firm</th>
                        </tr>
                    </thead>
                    <tbody>
                        {parsedRows.map((r, i) => (
                            <tr key={i} className="border-t border-slate-100">
                                <td className="p-3">{r.status === "error" ? <XCircle className="text-red-500 w-4 h-4"/> : <CheckCircle2 className="text-emerald-500 w-4 h-4"/>}</td>
                                <td className="p-3">{r.itemName}</td>
                                <td className="p-3">{r.designNo}</td>
                                <td className="p-3">{r.quantity}</td>
                                <td className="p-3">₹{r.purchaseRate}</td>
                                <td className="p-3">{r.gstOnPurchase}%</td>
                                <td className="p-3">{r.firm}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
      )}

      {step === "success" && createdVoucher && (
          <div className="p-8 bg-slate-50 min-h-screen">
             <div className="max-w-4xl mx-auto bg-white shadow-xl p-8 rounded-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
                <div className="text-center mb-6 border-b-2 border-red-600 pb-4">
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

                <div className="flex justify-between mb-4 text-xs font-bold">
                    <div className="w-1/2">
                        <p className="border-b border-black inline-block mb-1">Details of Receiver | Billed To</p>
                        <p>Name : <span className="ml-2 uppercase">{createdVoucher.supplierName}</span></p>
                        <p>GSTIN : <span className="ml-2">07AALPD0185E1Z1</span></p>
                        <p className="flex"><span className="mr-2">Address :</span> <span className="uppercase">W Z 127, RAM CHOWK ,<br/>SADH NAGAR, PALAM COLONY ,<br/>NEW DELHI .</span></p>
                        <p>State Name : <span className="uppercase">DELHI</span> <span className="ml-6">State Code : 07</span></p>
                        <p>Transport : <span className="uppercase">SELF AMIT</span></p>
                    </div>
                    <div className="w-1/2 text-right relative">
                        <div className="absolute top-0 right-0 -mt-10 mr-4 border border-black px-4 py-1 italic font-bold">TAX INVOICE</div>
                        <p>Page No. 1 of 1</p>
                        <p className="mt-4">Invoice No. <span className="font-extrabold text-base ml-2">{createdVoucher.invoiceNo}</span> <span className="ml-4">Date {createdVoucher.date}</span></p>
                        <p className="mt-1">State Name : DELHI <span className="ml-4">State Code 07</span></p>
                        <p className="mt-3 text-[10px] break-words max-w-[250px] float-right leading-tight"> IRN   No:3afefab242d6f9fccb064bee6285ed7a23a9d9c19eb98230cdd1a288eff77f0e</p>
                    </div>
                </div>

                <div className="w-full flex justify-between text-xs font-bold border-t border-b border-black py-1 mb-2">
                    <span>Date of Supply : {createdVoucher.date}</span>
                    <span>Agent : </span>
                </div>

                <table className="w-full text-[11px] border-collapse border-b-2 border-black">
                    <thead>
                        <tr className="border-b border-black text-center">
                            <th className="p-1 font-bold text-left border-r border-slate-300">S.No</th>
                            <th className="p-1 font-bold text-left border-r border-slate-300">Code | Particulars</th>
                            <th className="p-1 font-bold border-r border-slate-300">Hsn</th>
                            <th className="p-1 font-bold border-r border-slate-300">Qty Um</th>
                            <th className="p-1 font-bold border-r border-slate-300">Rate</th>
                            <th className="p-1 font-bold border-r border-slate-300">Total</th>
                            <th className="p-1 font-bold border-r border-slate-300">Disc</th>
                            <th className="p-1 font-bold border-r border-slate-300">Gst</th>
                            <th className="p-1 font-bold text-right">Taxable</th>
                        </tr>
                    </thead>
                    <tbody>
                        {createdVoucher.items.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-200 text-center uppercase">
                                <td className="p-1 text-left border-r border-slate-300">{idx + 1}</td>
                                <td className="p-1 text-left border-r border-slate-300 font-semibold">{item.itemCode || ""} {item.designNo} - {item.itemName}</td>
                                <td className="p-1 border-r border-slate-300">{item.hsnCode}</td>
                                <td className="p-1 border-r border-slate-300">{item.quantity} PCS</td>
                                <td className="p-1 border-r border-slate-300">{item.purchaseRate.toFixed(2)}</td>
                                <td className="p-1 border-r border-slate-300">{(item.quantity * item.purchaseRate).toFixed(2)}</td>
                                <td className="p-1 border-r border-slate-300">{item.calculatedDisc?.toFixed(1)}</td>
                                <td className="p-1 border-r border-slate-300">{item.gstOnPurchase.toFixed(1)}</td>
                                <td className="p-1 text-right">{item.calculatedTaxable.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="mt-4 flex justify-between items-end">
                    <div className="text-xs font-bold">
                        Amount In Words : <span className="uppercase">Rupees Generated Automatically Only</span>
                        
                        <div className="mt-6 text-red-600 text-lg uppercase tracking-wider">
                            ACCOUNTS ENQUIRES : 8595358898
                        </div>
                        <div className="mt-2 text-black">
                            <p className="text-sm underline mb-1 uppercase tracking-wide">Terms & Conditions :</p>
                            <p>★ Payment Strictly in 25 days. ★ No Claim No Guarantee in fashioners.</p>
                            <p>★ All Disputes subject to Delhi Jurisdiction only. ★ No Item will be accepted without barcode.</p>
                        </div>
                    </div>
                    <div className="text-right text-xs font-bold flex flex-col items-end">
                        <span>For K.R.CHHABRA & CO.</span>
                        <div className="mt-10 border-t border-black w-48 text-center pt-1">
                            Authorised Signatory
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-center gap-4 no-print">
                    <button onClick={() => window.print()} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold flex items-center gap-2">
                        <Printer className="w-4 h-4" /> Print Invoice
                    </button>
                    <button onClick={() => setStep("upload")} className="px-6 py-2 bg-slate-200 text-slate-800 rounded-lg font-bold">
                        Import Another PT File
                    </button>
                </div>
             </div>
          </div>
      )}
    </div>
  );
};
\`;

fs.writeFileSync(filepath, code);
console.log('File written successfully to ' + filepath);
