import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Plus, 
  Trash2, 
  Copy, 
  Save, 
  AlertCircle, 
  FileSpreadsheet, 
  LayoutGrid, 
  Search, 
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from "lucide-react";
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
  const [viewMode, setViewMode] = useState("table"); // 'table' (spreadsheet) | 'cards'
  const [searchFilter, setSearchFilter] = useState("");
  const invoiceRef = useRef(null);
  const tableScrollRef = useRef(null);

  const getEmptyItem = () => ({
    id: crypto.randomUUID(),
    productId: undefined,
    brand: "",
    designNo: "",
    barcode: "",
    itemName: "",
    subCategory: "", 
    itemCode: "",
    quantity: 1, 
    batch: "",
    counter: "",
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

  const mapPOItemToForm = (item) => {
    if (!item) return getEmptyItem();
    
    const brand = item.brand || item.brandName || item.brandId?.name || item.product?.brand || item.product?.brandId?.name || "";
    const designNo = item.designNo || item.design || item.product?.designNo || "";
    const barcode = item.barcode || item.barcodeNo || item.product?.barcode || "";
    const itemName = item.itemName || item.name || item.productName || item.product?.itemName || item.product?.name || "";
    const subCategory = item.subCategory || item.subItem || item.subItemName || item.product?.subItem || item.product?.subCategory || "";
    const itemCode = item.itemCode || item.code || item.product?.itemCode || "";
    const quantity = Number(item.quantity ?? item.qty ?? item.pcs ?? 1);
    const batch = item.batch || item.batchNo || item.product?.batch || "";
    const counter = item.counter || item.counterNo || item.product?.counter || "";
    const topBottomSet = item.topBottomSet || item.group1 || item.type || item.product?.topBottomSet || "";
    const gender = item.gender || item.group3 || item.product?.gender || "";
    const colorPrimary = item.colorPrimary || item.color || item.primaryColor || item.shade || item.product?.colorPrimary || item.product?.color || "";
    const colorSecondary = item.colorSecondary || item.secondaryColor || item.product?.colorSecondary || "";
    const size = item.size || item.sizes || item.product?.size || "";
    const purchaseRate = Number(item.purchaseRate ?? item.purchasePrice ?? item.rate ?? item.pRate ?? item.costPrice ?? 0);
    const gstOnPurchase = Number(item.gstOnPurchase ?? item.taxRate ?? item.gstPercent ?? item.gst ?? 5);
    const typeOfGstRaw = String(item.typeOfGst || item.gstType || "E").toUpperCase();
    const typeOfGst = ['I', 'E'].includes(typeOfGstRaw) ? typeOfGstRaw : 'E';
    
    let wspAfterGst = Number(item.wspAfterGst ?? item.afterGST ?? item.wsp ?? 0);
    if (!wspAfterGst && purchaseRate > 0) {
      wspAfterGst = typeOfGst === "E" ? Number((purchaseRate * (1 + (gstOnPurchase / 100))).toFixed(2)) : purchaseRate;
    }
    
    const mrp = Number(item.mrp ?? item.sellingPrice ?? item.retailPrice ?? item.defaultMRP ?? item.product?.mrp ?? item.product?.defaultMRP ?? 0);
    const gstOnSalePrice = Number(item.gstOnSalePrice ?? item.gstOnSale ?? item.saleGst ?? 5);
    const discountStatusRaw = String(item.discountStatus || item.discStatus || "N").toUpperCase();
    const discountStatus = ['B', 'A', 'N'].includes(discountStatusRaw) ? discountStatusRaw : 'N';
    const discountOnPurchase = Number(item.discountOnPurchase ?? item.discount ?? item.disc ?? 0);
    const hsnCode = item.hsnCode || item.hsn || item.hsnId?.code || item.hsnId?.hsnCode || item.product?.hsnCode || item.product?.hsn || "";
    const uniqueCode = item.uniqueCode || item.product?.uniqueCode || "";

    return {
      id: item.id || item._id || crypto.randomUUID(),
      productId: item.productId || item.product?._id || item.product?.id,
      brand,
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
      wspAfterGst,
      mrp,
      gstOnSalePrice,
      discountStatus,
      discountOnPurchase,
      hsnCode,
      uniqueCode,
      totalPrice: Number(item.totalPrice ?? item.lineTotal ?? item.amount ?? (quantity * purchaseRate))
    };
  };

  const getInitialHeaderDetails = (po) => {
    if (!po) {
      return {
        supplierName: "",
        invoiceNo: "",
        date: new Date().toISOString().split('T')[0],
        firm: "",
        warehouse: "Main Warehouse",
        remarks: "",
      };
    }
    const rawItems = po.items || po.billItems || po.products || po.rows || [];
    const firstItem = rawItems[0] || {};

    return {
      supplierName: po.supplierName || po.vendorName || po.vendorId?.name || po.vendorDetails?.name || "",
      invoiceNo: po.invoiceNo || po.billNo || po.poNo || "",
      date: po.date 
        ? String(po.date).split('T')[0] 
        : (po.billDate ? String(po.billDate).split('T')[0] : (po.createdAt ? String(po.createdAt).split('T')[0] : new Date().toISOString().split('T')[0])),
      firm: po.firm || po.firmName || po.company || po.firmId?.name || firstItem.firm || firstItem.company || "",
      warehouse: po.warehouse || po.warehouseId?.name || "Main Warehouse",
      remarks: po.remarks || "",
    };
  };

  // Header Details State
  const [headerDetails, setHeaderDetails] = useState(() => getInitialHeaderDetails(initialPO));

  // Items State
  const [items, setItems] = useState(() => {
    const rawItems = initialPO ? (initialPO.items || initialPO.billItems || initialPO.products || initialPO.rows || []) : [];
    if (rawItems.length > 0) {
      return rawItems.map(item => mapPOItemToForm(item));
    }
    return [getEmptyItem()];
  });

  // Sync state whenever initialPO changes
  useEffect(() => {
    if (initialPO) {
      setHeaderDetails(getInitialHeaderDetails(initialPO));
      const rawItems = initialPO.items || initialPO.billItems || initialPO.products || initialPO.rows || [];
      if (rawItems.length > 0) {
        setItems(rawItems.map(item => mapPOItemToForm(item)));
      }
    }
  }, [initialPO]);

  const updateHeader = (field, value) => {
    setHeaderDetails(prev => ({ ...prev, [field]: value }));
  };

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };

        // Auto calculate WSP after GST when purchaseRate, gstOnPurchase, or typeOfGst changes
        if (field === 'purchaseRate' || field === 'gstOnPurchase' || field === 'typeOfGst') {
          const rate = parseFloat(field === 'purchaseRate' ? value : updated.purchaseRate) || 0;
          const gstP = parseFloat(field === 'gstOnPurchase' ? value : updated.gstOnPurchase) || 0;
          const typeGst = String(field === 'typeOfGst' ? value : updated.typeOfGst).toUpperCase();
          if (typeGst === 'E') {
            updated.wspAfterGst = Number((rate + (rate * (gstP / 100))).toFixed(2));
          } else {
            updated.wspAfterGst = rate;
          }
        }

        return updated;
      }
      return item;
    }));
  };

  const addRow = () => {
    const newItem = getEmptyItem();
    setItems(prev => [...prev, newItem]);
    setTimeout(() => {
      const el = document.getElementById(`manual-cell-${items.length}-itemName`);
      if (el) el.focus();
    }, 100);
  };

  const removeRow = (id) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const duplicateRow = (id) => {
    const itemToClone = items.find(item => item.id === id);
    if (itemToClone) {
      setItems(prev => [...prev, { ...itemToClone, id: crypto.randomUUID() }]);
    }
  };

  const scrollTable = (direction) => {
    if (tableScrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      tableScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
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
        itemGst = (itemSubTotal - itemDiscAmt) * (gstP / 100);
      }
      
      subTotal += itemSubTotal;
      grandDisc += itemDiscAmt;
      gstTotal += itemGst;
      grandTotal += (itemSubTotal - itemDiscAmt);
    });

    return { subTotal, gstTotal, grandDisc, grandTotal };
  };

  const cols = [
    { key: "brand", label: "Brand", width: "w-28", minWidth: "min-w-[120px]" },
    { key: "designNo", label: "DesignNo", width: "w-28", minWidth: "min-w-[120px]" },
    { key: "barcode", label: "Barcode No", width: "w-36", minWidth: "min-w-[150px]" },
    { key: "itemName", label: "Item name", width: "w-36", minWidth: "min-w-[150px]", required: true },
    { key: "subCategory", label: "SUB ITEM NAME", width: "w-36", minWidth: "min-w-[140px]" },
    { key: "itemCode", label: "ITEM CODE", width: "w-28", minWidth: "min-w-[125px]" },
    { key: "quantity", label: "Total Qty.", type: "number", width: "w-20", minWidth: "min-w-[85px]" },
    { key: "batch", label: "BATCH", width: "w-28", minWidth: "min-w-[120px]" },
    { key: "counter", label: "COUNTER", width: "w-24", minWidth: "min-w-[110px]" },
    { key: "topBottomSet", label: "Group 1(Top/Bottom/SET)", width: "w-36", minWidth: "min-w-[145px]" },
    { key: "gender", label: "GROUP 3 (GENDER)", width: "w-28", minWidth: "min-w-[120px]" },
    { key: "colorPrimary", label: "Color(P)", width: "w-24", minWidth: "min-w-[110px]" },
    { key: "colorSecondary", label: "COLOR(S)", width: "w-24", minWidth: "min-w-[110px]" },
    { key: "size", label: "Size", width: "w-20", minWidth: "min-w-[85px]" },
    { key: "purchaseRate", label: "P. RATE", type: "number", width: "w-24", minWidth: "min-w-[100px]" },
    { key: "gstOnPurchase", label: "GST ON PURCHASE", type: "number", width: "w-24", minWidth: "min-w-[100px]" },
    { key: "typeOfGst", label: "type of gst(I/E)", width: "w-24", minWidth: "min-w-[95px]" },
    { key: "wspAfterGst", label: "WSP AFTER GST", type: "number", width: "w-28", minWidth: "min-w-[115px]" },
    { key: "mrp", label: "MRP", type: "number", width: "w-24", minWidth: "min-w-[100px]" },
    { key: "gstOnSalePrice", label: "GST ON SALE", type: "number", width: "w-24", minWidth: "min-w-[100px]" },
    { key: "discountStatus", label: "DISCOUNT STATUS(B/A/N)", width: "w-32", minWidth: "min-w-[130px]" },
    { key: "discountOnPurchase", label: "dis. On purchase", type: "number", width: "w-24", minWidth: "min-w-[100px]" },
    { key: "hsnCode", label: "HSNCode", width: "w-24", minWidth: "min-w-[110px]" },
    { key: "uniqueCode", label: "UNIQUE CODE", width: "w-28", minWidth: "min-w-[120px]" }
  ];

  const handleTableKeyDown = (e, rowIndex, colKey) => {
    const colIndex = cols.findIndex(c => c.key === colKey);
    if (colIndex === -1) return;
    const totalRows = filteredItems.length;
    const totalCols = cols.length;

    // Enter: Navigate forward to next column (or next row's first column)
    if (e.key === "Enter") {
      e.preventDefault();
      if (colIndex < totalCols - 1) {
        const nextColKey = cols[colIndex + 1].key;
        const nextEl = document.getElementById(`manual-cell-${rowIndex}-${nextColKey}`);
        if (nextEl) {
          nextEl.focus();
          if (typeof nextEl.select === "function") nextEl.select();
        }
      } else if (rowIndex < totalRows - 1) {
        const nextColKey = cols[0].key;
        const nextEl = document.getElementById(`manual-cell-${rowIndex + 1}-${nextColKey}`);
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
        const nextEl = document.getElementById(`manual-cell-${rowIndex + 1}-${colKey}`);
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
        const prevEl = document.getElementById(`manual-cell-${rowIndex - 1}-${colKey}`);
        if (prevEl) {
          prevEl.focus();
          if (typeof prevEl.select === "function") prevEl.select();
        }
      }
      return;
    }

    // Left Arrow: Move backward to previous column
    if (e.key === "ArrowLeft") {
      const val = e.target.value ?? "";
      const isAtStart = e.target.selectionStart === 0 && e.target.selectionEnd === 0;
      const isAllSelected = e.target.selectionStart === 0 && e.target.selectionEnd === String(val).length;
      if (isAtStart || isAllSelected || !val) {
        if (colIndex > 0) {
          e.preventDefault();
          const prevColKey = cols[colIndex - 1].key;
          const prevEl = document.getElementById(`manual-cell-${rowIndex}-${prevColKey}`);
          if (prevEl) {
            prevEl.focus();
            if (typeof prevEl.select === "function") prevEl.select();
          }
        } else if (rowIndex > 0) {
          e.preventDefault();
          const prevColKey = cols[totalCols - 1].key;
          const prevEl = document.getElementById(`manual-cell-${rowIndex - 1}-${prevColKey}`);
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
      const isAtEnd = e.target.selectionStart === String(val).length;
      const isAllSelected = e.target.selectionStart === 0 && e.target.selectionEnd === String(val).length;
      if (isAtEnd || isAllSelected || !val) {
        if (colIndex < totalCols - 1) {
          e.preventDefault();
          const nextColKey = cols[colIndex + 1].key;
          const nextEl = document.getElementById(`manual-cell-${rowIndex}-${nextColKey}`);
          if (nextEl) {
            nextEl.focus();
            if (typeof nextEl.select === "function") nextEl.select();
          }
        } else if (rowIndex < totalRows - 1) {
          e.preventDefault();
          const nextColKey = cols[0].key;
          const nextEl = document.getElementById(`manual-cell-${rowIndex + 1}-${nextColKey}`);
          if (nextEl) {
            nextEl.focus();
            if (typeof nextEl.select === "function") nextEl.select();
          }
        }
      }
      return;
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchFilter.trim()) return items;
    const term = searchFilter.toLowerCase().trim();
    return items.filter(it => 
      (it.itemName || "").toLowerCase().includes(term) ||
      (it.designNo || "").toLowerCase().includes(term) ||
      (it.barcode || "").toLowerCase().includes(term) ||
      (it.itemCode || "").toLowerCase().includes(term) ||
      (it.brand || "").toLowerCase().includes(term) ||
      (it.subCategory || "").toLowerCase().includes(term)
    );
  }, [items, searchFilter]);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!headerDetails.supplierName || !headerDetails.invoiceNo) {
      onAddNotification("Validation Error", "Vendor Name and Bill Number are required.", "warning");
      return;
    }

    const validItems = items.filter(item => 
      (item.itemName && item.itemName.trim() !== "") || 
      (item.itemCode && item.itemCode.trim() !== "") ||
      (item.barcode && item.barcode.trim() !== "") ||
      (item.designNo && item.designNo.trim() !== "")
    );

    if (validItems.length === 0) {
      onAddNotification("Validation Error", "At least one valid item with an Item Name, Design No, Item Code, or Barcode is required.", "warning");
      return;
    }

    setIsSubmitting(true);
    const totals = calculateTotals();

    const formattedItems = validItems.map((item, idx) => {
      const qty = parseFloat(item.quantity) || 1;
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
      
      if (!wspAfterGst && rate > 0) {
        wspAfterGst = item.typeOfGst?.toUpperCase() === "E" ? rate + (rate * (gstP / 100)) : rate;
      }

      return {
        _id: item.id && item.id.length === 24 ? item.id : undefined,
        productId: item.productId,
        brand: item.brand || "GENERIC BRAND",
        designNo: item.designNo || "DSG-001",
        barcode: item.barcode || "",
        itemName: item.itemName || item.itemCode || `Item-${idx + 1}`,
        name: item.itemName || item.itemCode || `Item-${idx + 1}`,
        productName: item.itemName || item.itemCode || `Item-${idx + 1}`,
        subCategory: item.subCategory || "Finished Goods",
        subItem: item.subCategory || "Finished Goods",
        itemCode: item.itemCode || `ITEM-${item.designNo || idx + 1}`,
        quantity: qty,
        qty: qty,
        batch: item.batch || "",
        counter: item.counter || "",
        topBottomSet: item.topBottomSet || "TOP",
        gender: item.gender || "UNISEX",
        colorPrimary: item.colorPrimary || "Standard",
        colorSecondary: item.colorSecondary || "",
        color: item.colorPrimary || "Standard",
        size: item.size || "FS",
        purchaseRate: rate,
        purchasePrice: rate,
        rate: rate,
        gstOnPurchase: gstP,
        taxRate: gstP,
        typeOfGst: item.typeOfGst || "E",
        wspAfterGst: Number(wspAfterGst.toFixed(2)),
        mrp: parseFloat(item.mrp) || 0,
        gstOnSalePrice: gstOnSale,
        discountStatus: item.discountStatus || "N",
        discountOnPurchase: discAmt,
        discount: discAmt,
        hsnCode: item.hsnCode || "5208",
        uniqueCode: item.uniqueCode || "",
        
        calculatedTaxable: taxable,
        calculatedDisc: discAmt,
        calculatedGst: itemGst,
        totalPrice: itemSubTotal - discAmt,
        amount: itemSubTotal - discAmt
      };
    });

    const newVoucherPayload = {
      _id: (initialPO?._id && /^[0-9a-fA-F]{24}$/.test(String(initialPO._id))) ? initialPO._id : (initialPO?.id && /^[0-9a-fA-F]{24}$/.test(String(initialPO.id)) ? initialPO.id : undefined),
      poNo: headerDetails.invoiceNo,
      billNo: headerDetails.invoiceNo,
      invoiceNo: headerDetails.invoiceNo,
      date: headerDetails.date,
      billDate: headerDetails.date,
      supplierName: headerDetails.supplierName,
      vendorName: headerDetails.supplierName,
      vendorId: initialPO?.vendorId?._id || initialPO?.vendorId || initialPO?.supplierId?._id || initialPO?.supplierId,
      firm: headerDetails.firm || "RANGOLI ENTERPRISES",
      firmName: headerDetails.firm || "RANGOLI ENTERPRISES",
      firmId: initialPO?.firmId?._id || initialPO?.firmId || initialPO?.firm?._id,
      warehouse: headerDetails.warehouse || "Main Warehouse",
      warehouseId: initialPO?.warehouseId?._id || initialPO?.warehouseId || initialPO?.warehouse?._id,
      items: formattedItems,
      billItems: formattedItems,
      products: formattedItems,
      rows: formattedItems,
      subTotal: totals.subTotal,
      gstTotal: totals.gstTotal,
      discount: totals.grandDisc,
      grandDisc: totals.grandDisc,
      grandTotal: totals.grandTotal,
      totalAmount: totals.grandTotal,
      status: "Completed",
      remarks: (headerDetails.warehouse ? headerDetails.warehouse + " - " : "") + (headerDetails.remarks || "")
    };

    let success = false;
    const poId = initialPO?._id || initialPO?.id || initialPO?.billNo || initialPO?.poNo || initialPO?.invoiceNo || headerDetails.invoiceNo;
    if (isEditMode && onUpdatePurchaseOrder && poId) {
      success = await onUpdatePurchaseOrder(poId, newVoucherPayload);
    } else if (onAddPurchaseOrder) {
      success = await onAddPurchaseOrder(newVoucherPayload);
    }

    if (success === false) {
      onAddNotification("Error", "Failed to save Purchase Order.", "danger");
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

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden select-none">
      {/* High-visibility scrollbar styling */}
      <style>{`
        .custom-pt-scrollbar {
          scrollbar-width: auto;
          scrollbar-color: #4f46e5 #e2e8f0;
        }
        .custom-pt-scrollbar::-webkit-scrollbar {
          height: 14px;
          width: 12px;
        }
        .custom-pt-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .custom-pt-scrollbar::-webkit-scrollbar-thumb {
          background: #4f46e5;
          border-radius: 8px;
          border: 2px solid #f1f5f9;
        }
        .custom-pt-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3730a3;
        }
      `}</style>

      {/* 1. PERSISTENT TOP HEADER BAR */}
      <div className="shrink-0 p-3 px-6 border-b border-slate-200 flex flex-wrap justify-between items-center bg-slate-50 gap-3 z-30 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-800">
              {isEditMode ? "Edit Purchase Entry" : "Manual Purchase Entry"}
            </h2>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              {items.length} {items.length === 1 ? "Item" : "Items"}
            </span>
            {headerDetails.invoiceNo && (
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                {headerDetails.invoiceNo}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {headerDetails.supplierName ? `${headerDetails.supplierName} • ` : ""}
            {isEditMode ? "Edit all garment fields and click Update." : "Create a purchase voucher manually."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Grand Total Badge */}
          <div className="hidden md:flex items-center gap-1.5 bg-indigo-50 border border-indigo-200/80 px-3 py-1.5 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Grand Total:</span>
            <span className="text-sm font-black text-indigo-700 font-mono">₹{grandTotal.toFixed(2)}</span>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === "table" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-800"}`}
              title="Spreadsheet Table View"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Spreadsheet</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === "cards" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-800"}`}
              title="Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>

          {/* Persistent Top Update Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            title={isEditMode ? "Update Purchase Voucher" : "Generate Purchase Voucher"}
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? "Saving..." : (isEditMode ? "Update Purchase Voucher" : "Generate Voucher")}</span>
          </button>

          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-500 hover:text-slate-700 font-bold px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-xs hover:bg-slate-50 transition-colors text-xs cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* 2. VOUCHER HEADER INFO & TOOLBAR (Compact, fixed under top bar) */}
      <div className="shrink-0 p-3 px-6 space-y-3 bg-slate-50/50 border-b border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Vendor Name *</label>
            <input 
              type="text" 
              value={headerDetails.supplierName} 
              onChange={e => updateHeader('supplierName', e.target.value)} 
              placeholder="e.g. Acme Supplier" 
              className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-xs" 
            />
          </div>
          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Bill Number *</label>
            <input 
              type="text" 
              value={headerDetails.invoiceNo} 
              onChange={e => updateHeader('invoiceNo', e.target.value)} 
              placeholder="e.g. INV-2023-001" 
              className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-xs" 
            />
          </div>
          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Bill Date *</label>
            <input 
              type="date" 
              value={headerDetails.date} 
              onChange={e => updateHeader('date', e.target.value)} 
              className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-xs" 
            />
          </div>
          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Firm</label>
            <input 
              type="text" 
              value={headerDetails.firm} 
              onChange={e => updateHeader('firm', e.target.value)} 
              placeholder="e.g. Firm Name" 
              className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-xs" 
            />
          </div>
        </div>

        {/* Search filter & Quick column navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by Design, Barcode, Item..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
              />
              {searchFilter && (
                <button onClick={() => setSearchFilter("")} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Showing <span className="font-bold text-slate-800">{filteredItems.length}</span> of {items.length} items
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Horizontal Scroll Quick Navigator for Spreadsheet */}
            {viewMode === "table" && (
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
                <button
                  type="button"
                  onClick={() => scrollTable('left')}
                  className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                  title="Scroll Columns Left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-bold text-slate-500 px-1 uppercase tracking-wider hidden sm:inline">Scroll Cols</span>
                <button
                  type="button"
                  onClick={() => scrollTable('right')}
                  className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                  title="Scroll Columns Right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button 
              type="button"
              onClick={addRow} 
              className="flex items-center gap-1.5 text-xs font-black text-white bg-indigo-600 px-3.5 py-1.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN TABLE / CARDS WORKSPACE (Fills 100% of remaining vertical height) */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-3 px-6 bg-slate-100/50">
        {viewMode === "table" && (
          <div className="flex-1 min-h-0 border border-slate-300 rounded-xl overflow-hidden shadow-sm bg-white flex flex-col">
            <div 
              ref={tableScrollRef}
              className="flex-1 overflow-auto custom-pt-scrollbar relative"
            >
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-800 text-slate-200 uppercase font-bold text-[10px] tracking-wider sticky top-0 z-20 shadow-xs">
                  <tr>
                    <th className="p-2.5 px-3 text-center border-b border-slate-700 w-12 sticky left-0 bg-slate-800 z-30">#</th>
                    {cols.map(c => (
                      <th key={c.key} className={`p-2.5 px-2 border-b border-slate-700 ${c.minWidth || 'min-w-[100px]'} ${c.type === 'number' ? 'text-right' : ''}`}>
                        {c.label} {c.required && <span className="text-red-400">*</span>}
                      </th>
                    ))}
                    <th className="p-2.5 px-3 text-center border-b border-slate-700 w-20 sticky right-0 bg-slate-800 z-30">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item, rowIndex) => (
                    <tr key={item.id} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="p-2 text-center font-bold text-slate-400 font-mono sticky left-0 bg-slate-50/95 z-10 border-r border-slate-100">
                        {rowIndex + 1}
                      </td>

                      {cols.map(c => (
                        <td key={c.key} className="p-1 px-1.5">
                          <input
                            id={`manual-cell-${rowIndex}-${c.key}`}
                            type={c.type === "number" ? "number" : "text"}
                            min={c.type === "number" ? "0" : undefined}
                            step={c.type === "number" ? "any" : undefined}
                            value={c.key === "size" && ((item.itemName || "").toLowerCase().includes("saree") || (item.subCategory || "").toLowerCase().includes("saree")) ? "FS" : (item[c.key] ?? "")}
                            onChange={e => updateItem(item.id, c.key, e.target.value)}
                            onKeyDown={e => handleTableKeyDown(e, rowIndex, c.key)}
                            disabled={c.key === "size" && ((item.itemName || "").toLowerCase().includes("saree") || (item.subCategory || "").toLowerCase().includes("saree"))}
                            className={`w-full p-1.5 px-2 text-xs border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all ${c.type === "number" ? "text-right font-mono" : ""} ${c.required ? 'font-semibold border-indigo-200 bg-indigo-50/20' : 'bg-white'} ${c.key === "size" && ((item.itemName || "").toLowerCase().includes("saree") || (item.subCategory || "").toLowerCase().includes("saree")) ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-70' : ''}`}
                            placeholder={c.required ? "Required" : ""}
                          />
                        </td>
                      ))}

                      <td className="p-1.5 text-center sticky right-0 bg-white/95 z-10 border-l border-slate-100 shadow-xs">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => duplicateRow(item.id)}
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                            title="Duplicate Row"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeRow(item.id)}
                            disabled={items.length === 1}
                            className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-20 cursor-pointer"
                            title="Delete Row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom table info bar */}
            <div className="shrink-0 p-2 px-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
              <span className="flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-indigo-500" />
                Visible scrollbar is right below. Scroll horizontally across all 24 columns, or use Enter/Arrow keys.
              </span>
              <span className="font-bold text-slate-700">
                {filteredItems.length} rows loaded
              </span>
            </div>
          </div>
        )}

        {viewMode === "cards" && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {filteredItems.map((item, idx) => (
              <div key={item.id} className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden relative animate-fade-in">
                <div className="bg-slate-800 text-slate-200 p-2.5 px-4 flex justify-between items-center">
                  <div className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="bg-slate-700 text-slate-200 w-5 h-5 flex items-center justify-center rounded-full text-[10px]">{idx + 1}</span>
                    Item Details: {item.itemName || item.designNo || `Item ${idx + 1}`}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => duplicateRow(item.id)} className="px-2.5 py-1 flex items-center gap-1 text-[10px] uppercase font-bold bg-slate-700 hover:bg-indigo-600 transition-colors rounded text-slate-200 cursor-pointer" title="Duplicate">
                      <Copy className="w-3 h-3" /> Duplicate
                    </button>
                    <button type="button" onClick={() => removeRow(item.id)} disabled={items.length === 1} className="px-2.5 py-1 flex items-center gap-1 text-[10px] uppercase font-bold bg-slate-700/50 hover:bg-red-600 transition-colors rounded text-slate-200 disabled:opacity-30 cursor-pointer" title="Delete">
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>

                <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 bg-slate-50/30">
                  {cols.map(c => (
                    <div key={c.key} className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">
                        {c.label} {c.required && <span className="text-red-500">*</span>}
                      </label>
                      <input 
                        type={c.type === "number" ? "number" : "text"} 
                        min={c.type === "number" ? "0" : undefined} 
                        step={c.type === "number" ? "any" : undefined} 
                        value={c.key === "size" && ((item.itemName || "").toLowerCase().includes("saree") || (item.subCategory || "").toLowerCase().includes("saree")) ? "FS" : (item[c.key] ?? "")} 
                        onChange={e => updateItem(item.id, c.key, e.target.value)} 
                        disabled={c.key === "size" && ((item.itemName || "").toLowerCase().includes("saree") || (item.subCategory || "").toLowerCase().includes("saree"))}
                        className={`w-full p-2 text-xs border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-xs ${c.type === "number" ? "text-left font-mono" : ""} ${c.required ? 'font-semibold border-indigo-200 bg-indigo-50/20' : 'bg-white'} ${c.key === "size" && ((item.itemName || "").toLowerCase().includes("saree") || (item.subCategory || "").toLowerCase().includes("saree")) ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-70' : ''}`} 
                        placeholder={c.required ? "Required" : ""} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. PERSISTENT FIXED BOTTOM ACTION BAR */}
      <div className="shrink-0 bg-white border-t border-slate-200 p-3 px-6 shadow-2xl flex flex-wrap items-center justify-between gap-4 z-30">
        <div className="flex items-center gap-4 sm:gap-6 text-xs text-slate-600 font-medium">
          <span className="font-bold text-slate-800">
            Total Items: <span className="font-mono text-indigo-600 font-black">{items.length}</span>
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="hidden sm:inline">
            Subtotal: <span className="font-mono font-bold text-slate-800">₹{subTotal.toFixed(2)}</span>
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="hidden sm:inline">
            GST: <span className="font-mono font-bold text-slate-800">₹{gstTotal.toFixed(2)}</span>
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span>
            Grand Total: <span className="font-mono text-sm font-black text-indigo-600">₹{grandTotal.toFixed(2)}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              "Saving Changes..."
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditMode ? "Update Purchase Voucher" : "Generate Purchase Voucher"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* 5. FULL SCREEN PROCESSING OVERLAY WHILE UPDATING */}
      {isSubmitting && (
        <div className="fixed inset-0 z-70 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center p-4 animate-fade-in text-white">
          <div className="bg-white text-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full text-center space-y-4 border border-slate-200 animate-scale-up">
            <div className="w-16 h-16 relative flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <RefreshCw className="w-6 h-6 text-indigo-600 absolute animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">
                {isEditMode ? "Updating Purchase Voucher" : "Generating Purchase Voucher"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Recalculating totals, syncing {items.length} items & updating inventory barcodes in database...
              </p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-indigo-600 h-1.5 rounded-full animate-pulse w-4/5 mx-auto"></div>
            </div>
            <p className="text-[11px] font-bold text-indigo-600">Please wait a moment...</p>
          </div>
        </div>
      )}
    </div>
  );
};
