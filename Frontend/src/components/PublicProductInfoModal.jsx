import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import {
  Barcode,
  Printer,
  Search,
  Check,
  Copy,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  X
} from "lucide-react";
import { generateCode128SvgString } from "../helpers/barcode128.helper";

export const PublicProductInfoModal = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Support /product-info/:barcode, query string ?code=..., or manual scan input
  const barcodeParam = params.barcode || params.code || searchParams.get("code") || searchParams.get("barcode") || "";

  const [searchCode, setSearchCode] = useState(barcodeParam);
  const [currentCode, setCurrentCode] = useState(barcodeParam);
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchProductInfo = async (codeToFetch) => {
    if (!codeToFetch) {
      setLoading(false);
      setError("Please scan or enter a product barcode / SKU / Item Code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch via public API endpoint
      const res = await api.get(`/products/public/info/${encodeURIComponent(codeToFetch.trim())}`);
      if (res.data && res.data.success && res.data.data) {
        setProductData(res.data.data);
      } else {
        throw new Error(res.data?.message || "Product style not found.");
      }
    } catch (err) {
      console.warn("Public product info fetch error:", err);
      // Fallback search check
      try {
        const fallbackRes = await api.get(`/search/barcode/${encodeURIComponent(codeToFetch.trim())}`);
        if (fallbackRes.data && fallbackRes.data.success && fallbackRes.data.data) {
          const item = fallbackRes.data.data;
          setProductData({
            id: item._id || item.id,
            name: item.itemName || item.name || "Garment Style",
            itemName: item.itemName || "Garment Style",
            designNo: item.designNo || "N/A",
            itemCode: item.itemCode || item.barcode || "N/A",
            sku: item.itemCode || item.barcode || "N/A",
            subItem: item.subItem || "",
            company: item.firmName || item.company || "New Fashion Style",
            uniqueCode: item.uniqueCode || "N/A",
            ipn: item.ipn || "N/A",
            batch: item.batch || "",
            counter: item.counter || "",
            category: item.category || item.categoryId?.name || "FABRIC SUIT",
            brand: item.brand || item.brandId?.name || "Generic",
            barcode: item.barcode || "",
            primaryColor: item.primaryColor || item.color || "-",
            secondaryColor: item.secondaryColor || "-",
            rackLocation: item.rack || item.rackLocation || "SHOWROOM",
            hsn: item.hsn || item.hsnId?.hsnCode || "520851",
            size: item.size || "FREE",
            description: item.description || (item.batch ? `Batch: ${item.batch}` : ""),
            purchaseRate: item.purchaseRate || item.purchasePrice || 0,
            purchasePrice: item.purchaseRate || item.purchasePrice || 0,
            wspAfterGST: item.wspAfterGST || item.purchaseRate || 0,
            mrp: item.mrp || item.defaultMRP || 0,
            stock: item.stock || 1,
            minStockAlert: 5
          });
        } else {
          setError(err.response?.data?.message || `No product record found matching barcode "${codeToFetch}".`);
        }
      } catch (fallbackErr) {
        setError(err.response?.data?.message || `No product record found matching barcode "${codeToFetch}".`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (barcodeParam) {
      setCurrentCode(barcodeParam);
      setSearchCode(barcodeParam);
      fetchProductInfo(barcodeParam);
    } else {
      setLoading(false);
    }
  }, [barcodeParam]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchCode.trim()) {
      navigate(`/product-info/${encodeURIComponent(searchCode.trim())}`);
    }
  };

  const p = productData || {};
  const hasExplicitBarcode = Boolean(p.barcode && String(p.barcode).trim());
  const activeBarcodeValue = hasExplicitBarcode
    ? String(p.barcode).trim()
    : (p.sku?.trim() || p.itemCode?.trim() || p.uniqueCode?.trim() || p.designNo?.trim() || currentCode || "PROD-ITEM");

  // Code 128 scannable SVG: if barcode no. present, display it under it; if not, leave text blank
  const barcodeSvgHtml = generateCode128SvgString(activeBarcodeValue, {
    width: 1.5,
    height: 40,
    displayValue: hasExplicitBarcode,
    fontSize: 11,
    font: "monospace",
    background: "#ffffff",
    lineColor: "#000000",
    margin: 4
  });

  const handlePrintTag = () => {
    const printWin = window.open("", "_blank", "width=400,height=420");
    if (!printWin) return;
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode Tag - ${p.itemName || p.name || 'Product'}</title>
          <style>
            @page { size: auto; margin: 4mm; }
            body { font-family: monospace; text-align: center; margin: 0; padding: 10px; color: #000; }
            .tag { border: 1px dashed #000; padding: 10px 8px; border-radius: 6px; max-width: 250px; margin: 0 auto; }
            .firm { font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
            .name { font-size: 10.5px; font-weight: bold; margin-bottom: 4px; }
            .meta { font-size: 9.5px; display: flex; justify-content: space-between; margin-bottom: 6px; font-weight: 600; }
            .mrp { font-size: 13px; font-weight: 900; margin-top: 6px; }
          </style>
        </head>
        <body>
          <div class="tag">
            <div class="firm">${p.company || p.firmName || 'New Fashion Style'}</div>
            <div class="name">${p.itemName || p.name || 'Garment Style'}</div>
            <div class="meta">
              <span>Size: <b>${p.size || 'FREE'}</b></span>
              <span>Design: <b>${p.designNo || '-'}</b></span>
            </div>
            <div style="margin: 4px 0;">${barcodeSvgHtml}</div>
            <div class="mrp">MRP: ₹${p.mrp || p.defaultMRP || 0}</div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeBarcodeValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center p-3 sm:p-6 text-slate-800">
      {/* Search Bar on Top for Quick Scan */}
      <div className="w-full max-w-lg mb-3 flex items-center gap-2">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="Scan or enter any Product Barcode / SKU..."
            className="w-full bg-white/95 text-slate-800 placeholder-slate-400 pl-9 pr-24 py-2 rounded-xl text-xs font-mono shadow-md border border-slate-200/80 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <button
            type="submit"
            className="absolute right-1 px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Lookup
          </button>
        </form>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl max-w-lg w-full p-12 shadow-2xl border border-slate-100 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Fetching Garment Style Parameters...
          </p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl border border-rose-100 text-center space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Product Style Not Found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {error}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Return to Catalog
            </button>
          </div>
        </div>
      ) : (
        /* EXACT POPUP MODAL AS IN SCREENSHOT */
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto animate-scale-up">
          {/* Header */}
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Update Garment Style Parameters
            </h4>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopyCode}
                title="Copy Barcode Key"
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={() => navigate("/")}
                title="Close"
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* CODE 128 SCANNABLE BARCODE PREVIEW CARD */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/90 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-indigo-600" />
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Code 128 Scannable Barcode
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${hasExplicitBarcode ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {hasExplicitBarcode ? `EAN: ${String(p.barcode).trim()}` : `Key: ${activeBarcodeValue}`}
                </span>
                <button
                  type="button"
                  onClick={handlePrintTag}
                  title="Print Barcode Tag"
                  className="p-1 px-2 text-[10px] font-bold bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                >
                  <Printer className="w-3 h-3 text-slate-600" />
                  Print Tag
                </button>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center">
              <div 
                className="max-w-full overflow-hidden flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: barcodeSvgHtml }}
              />
            </div>
          </div>

          {/* Form Fields Display */}
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-500 mb-1 font-semibold">
                  Garment / Product Name *
                </label>
                <input
                  readOnly
                  type="text"
                  value={p.itemName || p.name || ""}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  Design No.
                </label>
                <input
                  readOnly
                  type="text"
                  value={p.designNo || "N/A"}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  Item Code
                </label>
                <input
                  readOnly
                  type="text"
                  value={p.itemCode || p.sku || "N/A"}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono uppercase text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  Sub Item Type
                </label>
                <input
                  readOnly
                  type="text"
                  value={p.subItem || "e.g. BANARASI /"}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  Company / Firm
                </label>
                <input
                  readOnly
                  type="text"
                  value={p.company || p.firmName || "New Fashion Style"}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  Unique Code
                </label>
                <input
                  readOnly
                  type="text"
                  value={p.uniqueCode || "N/A"}
                  className="w-full bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl font-mono text-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  IPN (Piece No.)
                </label>
                <input
                  readOnly
                  type="text"
                  value={p.ipn || "N/A"}
                  className="w-full bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl font-mono text-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  Batch No. (PT File)
                </label>
                <input
                  readOnly
                  type="text"
                  value={p.batch || "N/A"}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  Counter (PT File)
                </label>
                <input
                  readOnly
                  type="text"
                  value={p.counter || "N/A"}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  Category Group
                </label>
                <input
                  readOnly
                  type="text"
                  value={p.category || "FABRIC SUIT"}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-medium text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  Brand Label
                </label>
                <input
                  readOnly
                  type="text"
                  value={p.brand || "Generic"}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-medium text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  SKU Code *
                </label>
                <input
                  readOnly
                  type="text"
                  value={p.sku || p.itemCode || "N/A"}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono uppercase font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  Barcode EAN
                </label>
                <input
                  readOnly
                  type="text"
                  value={p.barcode || ""}
                  placeholder="Leave blank if not assigned"
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  Primary Color
                </label>
                <input
                  readOnly
                  type="text"
                  value={p.primaryColor || p.color || "-"}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  Secondary Color
                </label>
                <input
                  readOnly
                  type="text"
                  value={p.secondaryColor || "-"}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  Rack Location
                </label>
                <input
                  readOnly
                  type="text"
                  value={p.rackLocation || "SHOWROOM"}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  HSN Code
                </label>
                <input
                  readOnly
                  type="text"
                  value={p.hsn || "520851"}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono text-slate-700"
                />
              </div>

              <div>
                <label className="text-slate-500 mb-1 font-semibold flex justify-between items-center">
                  <span>Sizing Code</span>
                  <span className="flex items-center gap-1.5 text-[9px] font-medium bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    <span>🟢 IN STOCK</span>
                    <span>🟡 LOW</span>
                    <span>🔴 OUT</span>
                  </span>
                </label>
                <div className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-semibold flex items-center justify-between">
                  <span>
                    {p.stock > 10 ? "🟢 " : (p.stock > 0 ? "🟡 " : "🔴 ")}
                    {p.size || "FREE"}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Stock: {p.stock ?? 0} pcs
                  </span>
                </div>
              </div>

              <div className="col-span-1 sm:col-span-2">
                <label className="block text-slate-500 mb-1 font-semibold">
                  Product Description / Batch Info
                </label>
                <input
                  readOnly
                  type="text"
                  value={p.description || (p.batch ? `Batch: ${p.batch}` : "")}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-3">
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  Purchase Rate (Cost)
                </label>
                <input
                  readOnly
                  type="text"
                  value={p.purchaseRate || p.purchasePrice || 0}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  WSP (After GST)
                </label>
                <input
                  readOnly
                  type="text"
                  value={p.wspAfterGST || 0}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  Retail MRP (Selling Price)
                </label>
                <input
                  readOnly
                  type="text"
                  value={p.mrp || p.defaultMRP || 0}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  Initial Stock Level
                </label>
                <input
                  readOnly
                  type="text"
                  value={p.stock || 0}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  Low Stock Threshold
                </label>
                <input
                  readOnly
                  type="text"
                  value={p.minStockAlert || 5}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono text-slate-700"
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={handlePrintTag}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print Barcode
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-md cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicProductInfoModal;
