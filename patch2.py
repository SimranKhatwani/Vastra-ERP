with open('Frontend/src/components/BillingPOSView.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

target = """                    <div className="flex justify-between">
                      <span className="text-slate-400">Payment Route:</span>
                      <span className="font-bold text-emerald-600">{selectedInvoiceForReturn.paymentMethod}</span>
                    </div>
                  </div>"""

repl = """                    <div className="flex justify-between">
                      <span className="text-slate-400">Payment Route:</span>
                      <span className="font-bold text-emerald-600">{selectedInvoiceForReturn.paymentMethod}</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-slate-200">
                      <button
                        onClick={() => handleDownloadReceiptHTML(selectedInvoiceForReturn)}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] py-2 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <FileText className="w-4 h-4" />
                        View Full Original Receipt
                      </button>
                    </div>
                  </div>"""

if target in c:
    with open('Frontend/src/components/BillingPOSView.jsx', 'w', encoding='utf-8') as f:
        f.write(c.replace(target, repl))
    print('Patched successfully!')
else:
    print('Target not found.')
