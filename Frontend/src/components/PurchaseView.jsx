import React, { useState, useRef } from "react";
import { FilePlus, Check, Download, Eye } from "lucide-react";
import { PTImporter, InvoiceViewer } from "./PTImporter";

export const PurchaseView = ({
  purchaseOrders,
  suppliers,
  setSuppliers,
  products,
  setProducts,
  onAddPurchaseOrder,
  onSettleSupplierBalance,
  onAddNotification,
}) => {
  const [activeTab, setActiveTab] = useState("pos");
  const [showImporter, setShowImporter] = useState(false);
  // Outstanding Payout form state
  const [selectedSupplierPayoutId, setSelectedSupplierPayoutId] = useState("");
  const [payoutAmount, setPayoutAmount] = useState(5000);

  // New PO State
  const [showPOModal, setShowPOModal] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState("");
  const [poProductId, setPoProductId] = useState("");
  const [poQty, setPoQty] = useState(100);

  // View Invoice state
  const [viewingPO, setViewingPO] = useState(null);
  const invoiceRef = useRef(null);

  // Pagination for POs
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(purchaseOrders.length / itemsPerPage) || 1;
  const paginatedPOs = purchaseOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const activeSupplierPayoutObj = suppliers.find(
    (s) => s.id === selectedSupplierPayoutId,
  );

  // Form Submit for New PO
  const handleCreatePOSubmit = (e) => {
    e.preventDefault();
    if (!poSupplierId || !poProductId) return;

    const matchedSupplier = suppliers.find((s) => s.id === poSupplierId);
    const matchedProduct = products.find((p) => p.id === poProductId);

    if (!matchedSupplier || !matchedProduct) return;

    const subTotal = matchedProduct.purchasePrice * poQty;
    const gstTotal = Math.floor(subTotal * (matchedProduct.gstPercent / 100));
    const grandTotal = subTotal + gstTotal;

    const newPO = {
      id: `po-${Date.now()}`,
      poNo: `PO-${20260000 + purchaseOrders.length + 1}`,
      date: "2026-06-28",
      supplierId: poSupplierId,
      supplierName: matchedSupplier.name,
      items: [
        {
          productId: poProductId,
          name: matchedProduct.name,
          quantity: poQty,
          purchasePrice: matchedProduct.purchasePrice,
          totalPrice: subTotal,
        },
      ],
      subTotal,
      gstTotal,
      grandTotal,
      status: "Pending",
      outstandingPaid: 0,
    };

    onAddPurchaseOrder(newPO);
    onAddNotification(
      "Supply Chain Ledger",
      `Compiled Purchase Order ${newPO.poNo} for ${newPO.grandTotal.toLocaleString()} pending dispatch.`,
      "success",
    );
    setShowPOModal(false);
    setPoSupplierId("");
    setPoProductId("");
  };

  const handleSettleSupplierPayout = (e) => {
    e.preventDefault();
    if (!selectedSupplierPayoutId || payoutAmount <= 0) return;

    if (
      activeSupplierPayoutObj &&
      activeSupplierPayoutObj.outstandingBalance < payoutAmount
    ) {
      onAddNotification(
        "Payout Warning",
        "Payout amount exceeds outstanding balance ledger.",
        "warning",
      );
      return;
    }

    onSettleSupplierBalance(selectedSupplierPayoutId, payoutAmount);
    onAddNotification(
      "Supplier Account Settled",
      `Processed ₹${payoutAmount.toLocaleString()} payment towards ${activeSupplierPayoutObj?.name}.`,
      "success",
    );
    setSelectedSupplierPayoutId("");
    setPayoutAmount(5000);
  };

  if (showImporter) {
    return (
      <div className="animate-fade-in pb-12">
        <PTImporter
          products={products}
          setProducts={setProducts}
          suppliers={suppliers}
          setSuppliers={setSuppliers}
          purchaseOrders={purchaseOrders}
          onAddPurchaseOrder={onAddPurchaseOrder}
          onAddNotification={onAddNotification}
          onClose={() => setShowImporter(false)}
        />
      </div>
    );
  }

  if (viewingPO) {
    return (
      <div className="animate-fade-in pb-12">
        <InvoiceViewer 
          createdVoucher={viewingPO}
          invoiceRef={invoiceRef}
          handlePrint={() => window.print()}
          onClose={() => setViewingPO(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12" id="purchase-mgmt-root">
      {/* Tab select */}
      <div className="flex border-b border-slate-100 pb-3">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("pos")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${activeTab === "pos" ? "bg-white text-slate-800" : "text-slate-500 hover:text-slate-800"}`}
          >
            Purchase Orders (PO)
          </button>
          <button
            onClick={() => setActiveTab("suppliers")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${activeTab === "suppliers" ? "bg-white text-slate-800" : "text-slate-500 hover:text-slate-800"}`}
          >
            Wholesale Suppliers
          </button>
        </div>
      </div>

      {/* VIEW: PURCHASE ORDERS */}
      {activeTab === "pos" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Active Procurement Pipelines
              </h3>
              <p className="text-xs text-slate-400">
                Total recorded supplier receipts: {purchaseOrders.length} orders
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowImporter(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Import PT File</span>
              </button>
              <button
                onClick={() => setShowPOModal(true)}
                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <FilePlus className="w-4 h-4" />
                <span>Raise PO</span>
              </button>
            </div>
          </div>

          {/* PO Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                    <th className="p-3.5">PO Number</th>
                    <th className="p-3.5">Date Raised</th>
                    <th className="p-3.5">Wholesaler</th>
                    <th className="p-3.5">Items</th>
                    <th className="p-3.5 text-right">Subtotal</th>
                    <th className="p-3.5 text-right">GST (12% Avg)</th>
                    <th className="p-3.5 text-right">Grand Total</th>
                    <th className="p-3.5 text-center">Dispatch Status</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {paginatedPOs.map((po, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-mono font-bold text-indigo-600">
                        {po.poNo}
                      </td>
                      <td className="p-3.5">{po.date}</td>
                      <td className="p-3.5 text-slate-800 font-semibold">
                        {po.supplierName}
                      </td>
                      <td className="p-3.5 max-w-[200px] truncate">
                        {po.items
                          .map((item) => `${item.quantity}x ${item.name}`)
                          .join(", ")}
                      </td>
                      <td className="p-3.5 text-right font-mono">
                        ₹{po.subTotal.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-400">
                        ₹{po.gstTotal.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                        ₹{po.grandTotal.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${po.status === "Completed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600 animate-pulse"}`}
                        >
                          {po.status === "Completed"
                            ? "Fulfilled"
                            : "Dispatched"}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => setViewingPO(po)}
                          className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="p-1 border rounded bg-white hover:bg-slate-50 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1 border rounded bg-white hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: WHOLESALE SUPPLIERS */}
      {activeTab === "suppliers" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Settle Outstanding Balance */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 lg:col-span-4 space-y-4 text-xs">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Disburse Ledger Payout
            </h4>
            <form onSubmit={handleSettleSupplierPayout} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Select Supplier
                </label>
                <select
                  required
                  value={selectedSupplierPayoutId}
                  onChange={(e) => setSelectedSupplierPayoutId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                >
                  <option value="">Select Supplier Account...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Bal: ₹{s.outstandingBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {activeSupplierPayoutObj && (
                <div className="bg-slate-50 p-4 rounded-xl space-y-1 border border-slate-100 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Supplier:</span>
                    <span className="text-slate-800 font-bold">
                      {activeSupplierPayoutObj.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Orders:</span>
                    <span>{activeSupplierPayoutObj.totalOrders} POs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Outstanding:</span>
                    <span className="text-red-500 font-bold">
                      ₹
                      {activeSupplierPayoutObj.outstandingBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Payout Amount (₹)
                </label>
                <input
                  required
                  type="number"
                  value={payoutAmount || ""}
                  onChange={(e) =>
                    setPayoutAmount(Math.max(1, Number(e.target.value)))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md"
              >
                Disburse Payout
              </button>
            </form>
          </div>

          {/* Suppliers List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden lg:col-span-8">
            <div className="p-4 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Registered Textile Wholesalers
              </h4>
            </div>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100 tracking-wider">
                    <th className="p-3.5">Supplier Name</th>
                    <th className="p-3.5">Contact Person</th>
                    <th className="p-3.5 font-mono">GSTIN Code</th>
                    <th className="p-3.5">Contact Details</th>
                    <th className="p-3.5 text-right">Outstanding Balance</th>
                    <th className="p-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {suppliers.map((sup, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3.5">
                        <p className="font-bold text-slate-800 leading-tight">
                          {sup.name}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {sup.totalOrders} completed purchase loops
                        </span>
                      </td>
                      <td className="p-3.5">{sup.contactPerson}</td>
                      <td className="p-3.5 font-mono text-slate-500 font-bold uppercase">
                        {sup.gstin}
                      </td>
                      <td className="p-3.5">
                        <p>{sup.phone}</p>
                        <p className="text-[10px] text-slate-400">
                          {sup.email}
                        </p>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-red-500">
                        ₹{sup.outstandingBalance.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${sup.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}
                        >
                          {sup.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW PURCHASE ORDER */}
      {showPOModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Draft Procurement PO
              </h4>
              <button
                onClick={() => setShowPOModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <Check className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <form
              onSubmit={handleCreatePOSubmit}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  Select Wholesaler *
                </label>
                <select
                  required
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700"
                >
                  <option value="">Select Wholesaler...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  Garment SKU style *
                </label>
                <select
                  required
                  value={poProductId}
                  onChange={(e) => setPoProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700"
                >
                  <option value="">Select SKU...</option>
                  {products.slice(0, 30).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Cost: ₹{p.purchasePrice})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  Procurement Quantity (Units)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={poQty}
                  onChange={(e) =>
                    setPoQty(Math.max(1, Number(e.target.value)))
                  }
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono"
                />
              </div>

              <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPOModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-950 text-white rounded-xl font-bold"
                >
                  Submit PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
