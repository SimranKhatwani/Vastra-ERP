with open('Frontend/src/components/BillingPOSView.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    if 'Payment Route:' in line:
        # The next line is the paymentMethod span, and the one after is </div>, and the one after is </div>
        # We will just look forward 2 lines and insert our button
        pass

# Actually, doing this string-wise with a small regex is safer
import re
with open('Frontend/src/components/BillingPOSView.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

pattern = r'(<span className="text-slate-400">Payment Route:</span>\s*<span className="font-bold text-emerald-600">\{selectedInvoiceForReturn\.paymentMethod\}</span>\s*</div>\s*)(</div>)'

replacement = r'''\1  <div className="pt-2 mt-2 border-t border-slate-200">
                      <button
                        onClick={() => handleDownloadReceiptHTML(selectedInvoiceForReturn)}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] py-2 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <FileText className="w-4 h-4" />
                        View Full Original Receipt
                      </button>
                    </div>
\2'''

if re.search(pattern, c):
    c = re.sub(pattern, replacement, c)
    with open('Frontend/src/components/BillingPOSView.jsx', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Success")
else:
    print("Not found")
