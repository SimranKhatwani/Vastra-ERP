const fs = require('fs');
const path = 'Frontend/src/components/BillingPOSView.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Replace states
content = content.replace(
  /const \[couponCode, setCouponCode\] = useState\(""\);\s*const \[flatDiscount, setFlatDiscount\] = useState\(0\);\s*const \[appliedDiscountName, setAppliedDiscountName\] = useState\(""\);/,
  `const [couponCode, setCouponCode] = useState("");
  const [manualDiscountIds, setManualDiscountIds] = useState([]);
  const [rejectedAutoDiscountIds, setRejectedAutoDiscountIds] = useState([]);`
);

content = content.replace(/const \[cancelAutoDiscount, setCancelAutoDiscount\] = useState\(false\);/, '');

// 2. Update clear logic
content = content.replace(/setFlatDiscount\(0\);\s*setAppliedDiscountName\(""\);\s*setCancelAutoDiscount\(false\);/g, 'setManualDiscountIds([]);\n    setRejectedAutoDiscountIds([]);');
content = content.replace(/setFlatDiscount\(0\);\s*setSelectedLoyaltyRuleId\(""\);\s*setCancelAutoDiscount\(false\);/g, 'setManualDiscountIds([]);\n    setRejectedAutoDiscountIds([]);\n    setSelectedLoyaltyRuleId("");');
content = content.replace(/setFlatDiscount\(0\);\s*setAppliedDiscountName\(""\);\s*setSelectedLoyaltyRuleId\(""\);\s*setCancelAutoDiscount\(false\);/g, 'setManualDiscountIds([]);\n    setRejectedAutoDiscountIds([]);\n    setSelectedLoyaltyRuleId("");');

// 3. Delete the useEffect block
content = content.replace(/\/\/ Auto-apply Automatic discounts\s*useEffect\(\(\) => \{[\s\S]*?\}, \[subTotal, discountRules, cancelAutoDiscount, flatDiscount, couponCode\]\);/, '');

// 4. Update the Modal buttons
content = content.replace(/setCouponCode\(rule.offerName\);\s*setAppliedDiscountName\(rule.offerName\);/g, `setManualDiscountIds(prev => prev.includes(rule._id || rule.id) ? prev : [...prev, (rule._id || rule.id)]);`);

content = content.replace(/const calcDiscount = rule.discountType === 'Flat' \? rule.discountValue : Math.floor\(subTotal \* \(rule.discountValue \/ 100\)\);\s*setFlatDiscount\(calcDiscount\);\s*setAppliedDiscountName\(rule.offerName\);\s*setCancelAutoDiscount\(true\);\s*onAddNotification\("Success", \`Applied \$\{rule.offerName\} \(\$\{calcDiscount\} OFF\)\`, "success"\);/, `setManualDiscountIds(prev => prev.includes(rule._id || rule.id) ? prev : [...prev, (rule._id || rule.id)]);
                                onAddNotification("Success", \`Applied \$\{rule.offerName\}\`, "success");`);

content = content.replace(
  /className=\{\`px-5 py-2\.5 rounded-xl font-bold whitespace-nowrap transition-colors \$\{isEligible \? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed'\}\`\}\s*>\s*Apply Offer/,
  `className={\`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors \$\{isEligible ? (manualDiscountIds.includes(rule._id || rule.id) ? 'bg-emerald-500 text-white shadow-md cursor-pointer' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 cursor-pointer') : 'bg-slate-100 text-slate-400 cursor-not-allowed'\}\`}
                          >
                            {manualDiscountIds.includes(rule._id || rule.id) ? 'Applied (Click to Remove)' : 'Apply Offer'}`
);

// Toggle removal if already applied
content = content.replace(
  /onClick=\{\(\) => \{\s*if \(rule\.offerType === 'Coupon'\) \{\s*setManualDiscountIds\(prev => prev\.includes\(rule\._id \|\| rule\.id\) \? prev : \[\.\.\.prev, \(rule\._id \|\| rule\.id\)\]\);\s*\} else \{\s*setManualDiscountIds\(prev => prev\.includes\(rule\._id \|\| rule\.id\) \? prev : \[\.\.\.prev, \(rule\._id \|\| rule\.id\)\]\);\s*onAddNotification\("Success", `Applied \$\{rule\.offerName\}`, "success"\);\s*\}\s*setShowDiscountSelectionModal\(false\);\s*\}\}/,
  `onClick={() => {
                              const rId = rule._id || rule.id;
                              if (manualDiscountIds.includes(rId)) {
                                setManualDiscountIds(prev => prev.filter(id => id !== rId));
                              } else {
                                setManualDiscountIds(prev => [...prev, rId]);
                                onAddNotification("Success", \`Applied \$\{rule.offerName\}\`, "success");
                              }
                            }}`
);


// 5. Update useMemo
const oldUseMemo = `  const { subTotal, discountTotal, couponDiscount, gstTotal, grandTotal, autoOffer, loyaltyOffer } = React.useMemo(() => {
    let subTotal = 0;
    let discountTotal = 0;

    cart.forEach((item) => {
      const itemPrice = item.sellingPrice || item.price || 0;
      const itemDisc = item.customDiscount || item.discount || 0;
      const sub = itemPrice * item.quantity;
      const disc = Math.floor(sub * (itemDisc / 100));

      subTotal += sub;
      discountTotal += disc;
    });

    // Evaluate dynamic active discount rules (Status Active + date validity checks)
    const activeOffers = discountRules.filter(r => {
      if (r.status !== 'Active') return false;
      const now = new Date();
      if (new Date(r.startDate) > now || new Date(r.endDate) < now) return false;
      return true;
    });

    let autoDiscountAmt = 0;
    let appliedOffer = null;

    if (!cancelAutoDiscount) {
      activeOffers.forEach(r => {
        let disc = 0;
        if (r.offerType === 'Automatic' && subTotal >= r.minBillAmount) {
          disc = r.discountType === 'Flat' ? r.discountValue : subTotal * (r.discountValue / 100);
        } else if (r.offerType === 'Product') {
          cart.forEach(item => {
            const matchedProd = products.find(p => p._id === item.productId || p.id === item.productId);
            const match = (r.applicableProducts || []).some(p => 
              p.toLowerCase().trim() === (item.productId || '').toLowerCase().trim() ||
              p.toLowerCase().trim() === (item.name || '').toLowerCase().trim() ||
              p.toLowerCase().trim() === (item.sku || '').toLowerCase().trim() ||
              (matchedProd && matchedProd.productCode && p.toLowerCase().trim() === matchedProd.productCode.toLowerCase().trim())
            );
            if (match) {
              const itemPrice = item.sellingPrice || item.price || 0;
              const itemSub = itemPrice * item.quantity;
              disc += r.discountType === 'Flat' ? r.discountValue * item.quantity : itemSub * (r.discountValue / 100);
            }
          });
        } else if (r.offerType === 'Category') {
          cart.forEach(item => {
            const matchedProd = products.find(p => p._id === item.productId || p.id === item.productId);
            if (matchedProd && matchedProd.category) {
              const match = (r.applicableCategories || []).some(c => c.toLowerCase().trim() === matchedProd.category.toLowerCase().trim());
              if (match) {
                const itemPrice = item.sellingPrice || item.price || 0;
              const itemSub = itemPrice * item.quantity;
                disc += r.discountType === 'Flat' ? r.discountValue * item.quantity : itemSub * (r.discountValue / 100);
              }
            }
          });
        } else if (r.offerType === 'Brand') {
          cart.forEach(item => {
            const matchedProd = products.find(p => p._id === item.productId || p.id === item.productId);
            if (matchedProd && matchedProd.brand) {
              const match = (r.applicableBrands || []).some(b => b.toLowerCase().trim() === matchedProd.brand.toLowerCase().trim());
              if (match) {
                const itemPrice = item.sellingPrice || item.price || 0;
              const itemSub = itemPrice * item.quantity;
                disc += r.discountType === 'Flat' ? r.discountValue * item.quantity : itemSub * (r.discountValue / 100);
              }
            }
          });
        }

        if (disc > autoDiscountAmt) {
          autoDiscountAmt = disc;
          appliedOffer = r;
        }
      });
    }

    // Evaluate automatic loyalty points rule discount (highest qualified points rule matches)
    let loyaltyDiscountAmt = 0;
    let appliedLoyaltyOffer = null;
    if (activeCustomer && activeCustomer.id !== "c-walkin" && !cancelAutoDiscount) {
      const eligibleLoyaltyRules = discountRules.filter(r => 
        r.offerType === 'LoyaltyRule' && 
        r.status === 'Active' &&
        (activeCustomer.loyaltyPoints || 0) >= r.requiredLoyaltyPoints
      );
      if (eligibleLoyaltyRules.length > 0) {
        const bestRule = eligibleLoyaltyRules.reduce((best, current) => 
          current.requiredLoyaltyPoints > best.requiredLoyaltyPoints ? current : best
        , eligibleLoyaltyRules[0]);

        loyaltyDiscountAmt = bestRule.discountType === 'Flat' ? bestRule.discountValue : subTotal * (bestRule.discountValue / 100);
        appliedLoyaltyOffer = bestRule;
      }
    }

    // Handle flat discount & coupon code
    let couponDiscount = 0;
    if (couponCode === "WINTER20") {
      couponDiscount = Math.floor(subTotal * 0.2);
    } else if (couponCode === "LOYALTY50") {
      couponDiscount = 500;
    } else if (couponCode === "FESTIVE15") {
      couponDiscount = Math.floor(subTotal * 0.15);
    }

    const totalDiscount = discountTotal + flatDiscount + couponDiscount + autoDiscountAmt + loyaltyDiscountAmt;
    const taxable = Math.max(0, subTotal - totalDiscount);

    // Apply default CGST + SGST config dynamically
    const totalTaxRate = cgstRate + sgstRate;
    const gstTotal = Math.floor(taxable * (totalTaxRate / 100));
    const grandTotal = taxable + gstTotal;

    return {
      subTotal,
      discountTotal: totalDiscount,
      couponDiscount,
      gstTotal,
      grandTotal,
      autoOffer: appliedOffer,
      loyaltyOffer: appliedLoyaltyOffer
    };
  }, [cart, couponCode, flatDiscount, cgstRate, sgstRate, discountRules, products, cancelAutoDiscount, selectedLoyaltyRuleId]);`;

const newUseMemo = \`  const { subTotal, discountTotal, couponDiscount, gstTotal, grandTotal, appliedDiscountsList } = React.useMemo(() => {
    let subTotal = 0;
    let discountTotal = 0; // Item level discounts

    cart.forEach((item) => {
      const itemPrice = item.sellingPrice || item.price || 0;
      const itemDisc = item.customDiscount || item.discount || 0;
      const sub = itemPrice * item.quantity;
      const disc = Math.floor(sub * (itemDisc / 100));

      subTotal += sub;
      discountTotal += disc;
    });

    const activeOffers = discountRules.filter(r => {
      if (r.status !== 'Active') return false;
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      if (new Date(r.endDate) < new Date() && new Date(r.endDate).setHours(23,59,59,999) < new Date()) return false;
      return true;
    });

    let totalRuleDiscount = 0;
    let appliedDiscountsList = [];

    activeOffers.forEach(r => {
      const rId = r._id || r.id;
      const isManual = manualDiscountIds.includes(rId);
      const isAutoType = ['Automatic', 'Product', 'Category', 'Brand'].includes(r.offerType);
      
      // If it's manual, or if it's auto and not rejected
      if (isManual || (isAutoType && !rejectedAutoDiscountIds.includes(rId))) {
        let disc = 0;

        if (r.offerType === 'Automatic' || r.offerType === 'Coupon' || r.offerType === 'Flat') {
          if (subTotal >= (r.minBillAmount || 0)) {
            disc = r.discountType === 'Flat' ? r.discountValue : Math.floor(subTotal * (r.discountValue / 100));
          }
        } else if (r.offerType === 'Product') {
          cart.forEach(item => {
            const matchedProd = products.find(p => p._id === item.productId || p.id === item.productId);
            const match = (r.applicableProducts || []).some(p => 
              p.toLowerCase().trim() === (item.productId || '').toLowerCase().trim() ||
              p.toLowerCase().trim() === (item.name || '').toLowerCase().trim() ||
              p.toLowerCase().trim() === (item.sku || '').toLowerCase().trim() ||
              (matchedProd && matchedProd.productCode && p.toLowerCase().trim() === matchedProd.productCode.toLowerCase().trim())
            );
            if (match) {
              const itemSub = (item.sellingPrice || item.price || 0) * item.quantity;
              disc += r.discountType === 'Flat' ? r.discountValue * item.quantity : Math.floor(itemSub * (r.discountValue / 100));
            }
          });
        } else if (r.offerType === 'Category') {
          cart.forEach(item => {
            const matchedProd = products.find(p => p._id === item.productId || p.id === item.productId);
            if (matchedProd && matchedProd.category) {
              const match = (r.applicableCategories || []).some(c => c.toLowerCase().trim() === matchedProd.category.toLowerCase().trim());
              if (match) {
                const itemSub = (item.sellingPrice || item.price || 0) * item.quantity;
                disc += r.discountType === 'Flat' ? r.discountValue * item.quantity : Math.floor(itemSub * (r.discountValue / 100));
              }
            }
          });
        } else if (r.offerType === 'Brand') {
          cart.forEach(item => {
            const matchedProd = products.find(p => p._id === item.productId || p.id === item.productId);
            if (matchedProd && matchedProd.brand) {
              const match = (r.applicableBrands || []).some(b => b.toLowerCase().trim() === matchedProd.brand.toLowerCase().trim());
              if (match) {
                const itemSub = (item.sellingPrice || item.price || 0) * item.quantity;
                disc += r.discountType === 'Flat' ? r.discountValue * item.quantity : Math.floor(itemSub * (r.discountValue / 100));
              }
            }
          });
        }

        if (disc > 0) {
          totalRuleDiscount += disc;
          appliedDiscountsList.push({ id: rId, name: r.offerName, amount: disc, type: isManual ? 'Manual' : 'Auto' });
        }
      }
    });

    // Loyalty Points Logic
    if (activeCustomer && activeCustomer.id !== "c-walkin" && !rejectedAutoDiscountIds.includes("loyalty")) {
      const eligibleLoyaltyRules = discountRules.filter(r => 
        r.offerType === 'LoyaltyRule' && r.status === 'Active' &&
        (activeCustomer.loyaltyPoints || 0) >= r.requiredLoyaltyPoints
      );
      if (eligibleLoyaltyRules.length > 0) {
        const bestRule = eligibleLoyaltyRules.reduce((best, current) => 
          current.requiredLoyaltyPoints > best.requiredLoyaltyPoints ? current : best
        , eligibleLoyaltyRules[0]);
        const lDisc = bestRule.discountType === 'Flat' ? bestRule.discountValue : Math.floor(subTotal * (bestRule.discountValue / 100));
        if (lDisc > 0) {
          totalRuleDiscount += lDisc;
          appliedDiscountsList.push({ id: 'loyalty', name: \`Loyalty (\${bestRule.requiredLoyaltyPoints} pts)\`, amount: lDisc, type: 'Auto' });
        }
      }
    }

    // Legacy coupon codes
    let couponDiscount = 0;
    if (couponCode === "WINTER20") {
      couponDiscount = Math.floor(subTotal * 0.2);
    } else if (couponCode === "LOYALTY50") {
      couponDiscount = 500;
    } else if (couponCode === "FESTIVE15") {
      couponDiscount = Math.floor(subTotal * 0.15);
    }
    if (couponDiscount > 0) {
      totalRuleDiscount += couponDiscount;
      appliedDiscountsList.push({ id: 'legacy', name: couponCode, amount: couponDiscount, type: 'Legacy' });
    }

    const totalOverallDiscount = discountTotal + totalRuleDiscount;
    const taxable = Math.max(0, subTotal - totalOverallDiscount);
    const totalTaxRate = cgstRate + sgstRate;
    const gstTotal = Math.floor(taxable * (totalTaxRate / 100));
    const grandTotal = taxable + gstTotal;

    return {
      subTotal,
      discountTotal: totalOverallDiscount,
      couponDiscount,
      gstTotal,
      grandTotal,
      appliedDiscountsList
    };
  }, [cart, couponCode, manualDiscountIds, rejectedAutoDiscountIds, cgstRate, sgstRate, discountRules, products, activeCustomer]);\`;

content = content.replace(oldUseMemo, newUseMemo);

// 6. Replace UI Applied Discount Block
const oldUI = \`                   {/* Applied Discount Block */}
                   {appliedDiscountName && (
                     <div className="bg-indigo-50 border border-indigo-200 w-[400px] p-2 mt-1 shadow-sm rounded-md flex justify-between items-center text-xs font-bold text-indigo-800">
                       <span>Applied: {appliedDiscountName}</span>
                       <button 
                         onClick={() => {
                           setFlatDiscount(0);
                           setCouponCode("");
                           setAppliedDiscountName("");
                           setCancelAutoDiscount(true);
                         }} 
                         className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-2 py-0.5 rounded shadow-sm text-[10px] cursor-pointer"
                       >
                         Remove
                       </button>
                     </div>
                   )}\`;

const newUI = \`                   {/* Applied Discount Block */}
                   {appliedDiscountsList && appliedDiscountsList.length > 0 && (
                     <div className="w-[400px] mt-1 space-y-1">
                       {appliedDiscountsList.map(d => (
                         <div key={d.id} className="bg-indigo-50 border border-indigo-200 p-2 shadow-sm rounded-md flex justify-between items-center text-xs font-bold text-indigo-800">
                           <span>Applied: {d.name} (,1{d.amount} OFF)</span>
                           <button 
                             onClick={() => {
                               if (d.type === 'Manual') {
                                 setManualDiscountIds(prev => prev.filter(id => id !== d.id));
                               } else if (d.type === 'Legacy') {
                                 setCouponCode("");
                               } else {
                                 setRejectedAutoDiscountIds(prev => [...prev, d.id]);
                               }
                             }} 
                             className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-2 py-0.5 rounded shadow-sm text-[10px] cursor-pointer"
                           >
                             Remove
                           </button>
                         </div>
                       ))}
                     </div>
                   )}\`;

content = content.replace(oldUI, newUI);

fs.writeFileSync(path, content);
console.log('Modifications completed.');
