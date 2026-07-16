import React, { useState, useRef } from "react";
import { Plus, Trash2, Copy, Save, AlertCircle } from "lucide-react";
import { InvoiceViewer } from "./PTImporter"; 

export const ManualPurchaseEntry = ({ 
  initialPO,
  isEditMode,
  onAddPurchaseOrder,
  onUpdatePurchaseOrder, 
  onAddNotification,
  onClose 
}) => {
  const [createdVoucher, setCreatedVoucher] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const invoiceRef = useRef(null);

  // Header Details
  const [headerDetails, setHeaderDetails] = useState({
    supplierName: initialPO ? initialPO.supplierName : "", 
    invoiceNo: initialPO ? (initialPO.invoiceNo || "") : "", 
    date: initialPO ? (initialPO.date ? initialPO.date.split('T')[0] : new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0], 
    firm: "", 
    warehouse: "Main Warehouse",
    remarks: "",
  });

  const getEmptyItem = () => ({
    id: crypto.randomUUID(),
    brand: "",
    designNo: "",
    barcode: "",
    itemName: "",
    subCategory: "", 
    itemCode: "",
    quantity: 1, 
    batch: "",
    topBottomSet: "", 
    gender: "", 
    colorPrimary: "", 
    colorSecondary: "", 
    size: "",
    purchaseRate: 0, 
    gstOnPurchase: 5, 
    typeOfGst: "E", 
    wspAfterGst: 0,
    mrp: 0,
    gstOnSalePrice: 5, 
    discountStatus: "N", 
    discountOnPurchase: 0, 
    hsnCode: "",
    uniqueCode: ""
  });

  const [items, setItems] = useState(initialPO && initialPO.items ? initialPO.items.map(item => ({
    ...getEmptyItem(),
    id: crypto.randomUUID(),
    itemName: item.name,
    quantity: item.quantity,
    purchaseRate: item.purchasePrice,
    totalPrice: item.totalPrice,
  })) : [getEmptyItem()]);

  const updateHeader = (field, value) => {
    setHeaderDetails(prev => ({ ...prev, [field]: value }));
  };

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const addRow = () => setItems(prev => [...prev, getEmptyItem()]);
  const removeRow = (id) => {
    if (items.length > 1) setItems(prev => prev.filter(item => item.id !== id));
  };
  const duplicateRow = (id) => {
    const itemToClone = items.find(item => item.id === id);
    if (itemToClone) setItems(prev => [...prev, { ...itemToClone, id: Date.now() + Math.random() }]);
  };

  const calculateTotals = () => {
    let subTotal = 0;
    let gstTotal = 0;
    let grandDisc = 0;
    let grandTotal = 0;

    items.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.purchaseRate) || 0;
      const disc = parseFloat(item.discountOnPurchase) || 0;
      const gstP = parseFloat(item.gstOnPurchase) || 0;
      
      const itemSubTotal = qty * rate;
      let itemGst = 0;
      let taxable = itemSubTotal;
      let itemDiscAmt = disc;

      if (item.typeOfGst?.toUpperCase() === "I") {
        taxable = itemSubTotal / (1 + (gstP / 100));
        itemGst = itemSubTotal - taxable;
      } else {
        itemGst = taxable * (gstP / 100);
      }
      
      subTotal += taxable;
      grandDisc += itemDiscAmt;
      gstTotal += itemGst;
      grandTotal += (taxable + itemGst - itemDiscAmt);
    });

    return { subTotal, gstTotal, grandDisc, grandTotal };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!headerDetails.supplierName || !headerDetails.invoiceNo) {
      onAddNotification("Validation Error", "Vendor Name and Bill Number are required.", "warning");
      return;
    }

    const validItems = items.filter(item => 
      (item.itemName && item.itemName.trim() !== "") || 
      (item.itemCode && item.itemCode.trim() !== "") ||
      (item.barcode && item.barcode.trim() !== "")
    );

    if (validItems.length === 0) {
      onAddNotification("Validation Error", "At least one valid item with an Item Name, Item Code, or Barcode is required.", "warning");
      return;
    }

    setIsSubmitting(true);
    const totals = calculateTotals();

    const formattedItems = validItems.map((item, idx) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.purchaseRate) || 0;
      const discAmt = parseFloat(item.discountOnPurchase) || 0;
      const gstP = parseFloat(item.gstOnPurchase) || 0;
      const gstOnSale = parseFloat(item.gstOnSalePrice) || 0;
      const itemSubTotal = qty * rate;
      
      let itemGst = 0;
      let taxable = itemSubTotal;
      let wspAfterGst = parseFloat(item.wspAfterGst) || 0;

      if (item.typeOfGst?.toUpperCase() === "I") {
        taxable = itemSubTotal / (1 + (gstP / 100));
        itemGst = itemSubTotal - taxable;
      } else {
        itemGst = taxable * (gstP / 100);
      }
      
      if (!wspAfterGst) {
        wspAfterGst = item.typeOfGst?.toUpperCase() === "E" ? rate + (rate * (gstP / 100)) : rate;
      }

      return {
        brand: item.brand || "NA",
        designNo: item.designNo || "NA",
        barcode: item.barcode || "NA",
        itemName: item.itemName || item.itemCode || `Item-${idx + 1}`,
        subCategory: item.subCategory || "Finished Goods",
        itemCode: item.itemCode || "NA",
        qty: qty,
        batch: item.batch || "NA",
        topBottomSet: item.topBottomSet || "NA",
        gender: item.gender || "NA",
        colorPrimary: item.colorPrimary || "NA",
        colorSecondary: item.colorSecondary || "NA",
        size: item.size || "NA",
        purchaseRate: rate,
        gstOnPurchase: gstP,
        typeOfGst: item.typeOfGst || "E",
        wspAfterGst: wspAfterGst,
        mrp: parseFloat(item.mrp) || 0,
        gstOnSalePrice: gstOnSale,
        discountStatus: item.discountStatus || "N",
        discountOnPurchase: discAmt,
        hsnCode: item.hsnCode || "NA",
        uniqueCode: item.uniqueCode || "NA",
        
        calculatedTaxable: taxable,
        calculatedDisc: discAmt,
        calculatedGst: itemGst,
        totalPrice: taxable - discAmt + itemGst,
      };
    });

    const newVoucherPayload = {
      poNo: `${headerDetails.invoiceNo}-${Math.floor(Math.random() * 10000)}`,
      invoiceNo: headerDetails.invoiceNo,
      date: headerDetails.date,
      supplierName: headerDetails.supplierName,
      firm: headerDetails.firm,
      items: formattedItems,
      subTotal: totals.subTotal,
      gstTotal: totals.gstTotal,
      grandTotal: totals.grandTotal,
      status: "Completed",
      remarks: headerDetails.warehouse + " - " + headerDetails.remarks
    };

    let success = false;
    if (isEditMode && onUpdatePurchaseOrder) {
      success = await onUpdatePurchaseOrder(initialPO.id, newVoucherPayload);
    } else if (onAddPurchaseOrder) {
      success = await onAddPurchaseOrder(newVoucherPayload);
    }

    if (success === false) {
      onAddNotification("Error", "Failed to save Purchase Order.", "error");
      setIsSubmitting(false);
      return;
    }
    
    onAddNotification("Success", `Purchase Voucher ${isEditMode ? 'updated' : 'generated'} successfully.`, "success");
    setCreatedVoucher(newVoucherPayload);
    setIsSubmitting(false);
  };

  const handlePrint = () => window.print();

  if (createdVoucher) {
    return (
      <InvoiceViewer 
        createdVoucher={createdVoucher}
        invoiceRef={invoiceRef}
        handlePrint={handlePrint}
        onClose={onClose}
      />
    );
  }

  const { subTotal, gstTotal, grandDisc, grandTotal } = calculateTotals();

  const cols = [
    { key: "brand", label: "Brand", width: "w-24" },
    { key: "designNo", label: "DesignNo", width: "w-24" },
    { key: "barcode", label: "Barcode No", width: "w-28" },
    { key: "itemName", label: "Item name", width: "w-32", required: true },
    { key: "subCategory", label: "SUB ITEM NAME", width: "w-32" },
    { key: "itemCode", label: "ITEM CODE", width: "w-24" },
    { key: "quantity", label: "Total Qty.", type: "number", width: "w-20" },
    { key: "batch", label: "BATCH", width: "w-20" },
    { key: "topBottomSet", label: "Group 1(Top/Bottom/SET)", width: "w-40" },
    { key: "gender", label: "GROUP 3 (GENDER)", width: "w-32" },
    { key: "colorPrimary", label: "Color(P)", width: "w-20" },
    { key: "colorSecondary", label: "COLOR(S)", width: "w-20" },
    { key: "size", label: "Size", width: "w-16" },
    { key: "purchaseRate", label: "P. RATE", type: "number", width: "w-24" },
    { key: "gstOnPurchase", label: "GST ON PURCHASE", type: "number", width: "w-24" },
    { key: "typeOfGst", label: "type of gst(I/E)", width: "w-24" },
    { key: "wspAfterGst", label: "WSP AFTER GST", type: "number", width: "w-24" },
    { key: "mrp", label: "MRP", type: "number", width: "w-20" },
    { key: "gstOnSalePrice", label: "GST ON SALE", type: "number", width: "w-20" },
    { key: "discountStatus", label: "DISCOUNT STATUS(B/A/N)", width: "w-40" },
    { key: "discountOnPurchase", label: "dis. On purchase", type: "number", width: "w-24" },
    { key: "hsnCode", label: "HSNCode", width: "w-20" },
    { key: "uniqueCode", label: "UNIQUE CODE", width: "w-24" }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full relative">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
        <div>
          <h2 className="text-lg font-black text-slate-800">{isEditMode ? "Edit Purchase Entry" : "Manual Purchase Entry"}</h2>
          <p className="text-xs text-slate-500 font-medium">{isEditMode ? "Update an existing purchase voucher." : "Create a purchase voucher manually with full Garment ERP fields."}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold px-3 py-1 bg-white rounded-lg border shadow-sm">
          Close
        </button>
      </div>

      <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div className="grid grid-cols-4 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Vendor Name *</label>
            <input type="text" value={headerDetails.supplierName} onChange={e => updateHeader('supplierName', e.target.value)} placeholder="e.g. Acme Supplier" className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Bill Number *</label>
            <input type="text" value={headerDetails.invoiceNo} onChange={e => updateHeader('invoiceNo', e.target.value)} placeholder="e.g. INV-2023-001" className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Bill Date *</label>
            <input type="date" value={headerDetails.date} onChange={e => updateHeader('date', e.target.value)} className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Firm</label>
            <input type="text" value={headerDetails.firm} onChange={e => updateHeader('firm', e.target.value)} placeholder="e.g. Firm Name" className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
        </div>

        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={item.id} className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden relative animate-fade-in">
              <div className="bg-slate-800 text-slate-200 p-2.5 px-4 flex justify-between items-center">
                <div className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="bg-slate-700 text-slate-200 w-5 h-5 flex items-center justify-center rounded-full text-[10px]">{idx + 1}</span>
                  Item Details
                </div>
                <div className="flex gap-2">
                  <button onClick={() => duplicateRow(item.id)} className="px-2 py-1 flex items-center gap-1 text-[10px] uppercase font-bold bg-slate-700 hover:bg-indigo-600 transition-colors rounded text-slate-200" title="Duplicate">
                    <Copy className="w-3 h-3" /> Duplicate
                  </button>
                  <button onClick={() => removeRow(item.id)} disabled={items.length === 1} className="px-2 py-1 flex items-center gap-1 text-[10px] uppercase font-bold bg-slate-700/50 hover:bg-red-600 transition-colors rounded text-slate-200 disabled:opacity-30" title="Delete">
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
              </div>

              <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 bg-slate-50/30">
                {cols.map(c => (
                  <div key={c.key} className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500">
                      {c.label} {c.required && <span className="text-red-500">*</span>}
                    </label>
                    <input 
                      type={c.type === "number" ? "number" : "text"} 
                      min={c.type === "number" ? "0" : undefined} 
                      step={c.type === "number" ? "any" : undefined} 
                      value={c.key === "size" && ((item.itemName || "").toLowerCase().includes("saree") || (item.subCategory || "").toLowerCase().includes("saree")) ? "FS" : item[c.key]} 
                      onChange={e => updateItem(item.id, c.key, e.target.value)} 
                      disabled={c.key === "size" && ((item.itemName || "").toLowerCase().includes("saree") || (item.subCategory || "").toLowerCase().includes("saree"))}
                      className={`w-full p-2 text-xs border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-sm ${c.type === "number" ? "text-left font-mono" : ""} ${c.required ? 'font-semibold border-indigo-200 bg-indigo-50/20' : 'bg-white'} ${c.key === "size" && ((item.itemName || "").toLowerCase().includes("saree") || (item.subCategory || "").toLowerCase().includes("saree")) ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-70' : ''}`} 
                      placeholder={c.required ? "Required" : ""} 
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-[10px] text-indigo-600/70 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-indigo-500" /> 
              System auto-calculates grand totals including GST and itemized discounts across all items above.
            </div>
            <button onClick={addRow} className="flex items-center gap-1.5 text-xs font-black text-indigo-600 bg-indigo-100 px-5 py-2.5 rounded-xl hover:bg-indigo-200 transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Add Another Item
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <div className="w-72 bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2 shadow-sm">
            <div className="flex justify-between text-xs font-semibold text-slate-500"><span>Subtotal:</span><span className="font-mono">₹{subTotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-xs font-semibold text-rose-500"><span>Total Discount:</span><span className="font-mono">- ₹{grandDisc.toFixed(2)}</span></div>
            <div className="flex justify-between text-xs font-semibold text-slate-500"><span>GST Total:</span><span className="font-mono">₹{gstTotal.toFixed(2)}</span></div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-800"><span>Grand Total:</span><span className="font-mono text-indigo-600">₹{grandTotal.toFixed(2)}</span></div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 rounded-b-2xl">
        <button onClick={onClose} className="px-6 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">Cancel</button>
        <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 shadow-sm disabled:opacity-50">
          {isSubmitting ? "Processing..." : <><Save className="w-4 h-4" /> {isEditMode ? "Update Purchase Voucher" : "Generate Purchase Voucher"}</>}
        </button>
      </div>
    </div>
  );
};
