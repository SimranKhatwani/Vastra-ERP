import re

with open('Frontend/src/components/BillingPOSView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the entire useMemo block
old_useMemo_pattern = r'  const \{ subTotal, discountTotal, couponDiscount, gstTotal, grandTotal, autoOffer, loyaltyOffer \} = React\.useMemo\(\(\) => \{.*?  \}, \[cart, couponCode, flatDiscount, cgstRate, sgstRate, discountRules, products, cancelAutoDiscount, selectedLoyaltyRuleId\]\);'

new_useMemo = """  const { subTotal, discountTotal, couponDiscount, gstTotal, grandTotal, appliedDiscountsList } = React.useMemo(() => {
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
          appliedDiscountsList.push({ id: 'loyalty', name: `Loyalty (${bestRule.requiredLoyaltyPoints} pts)`, amount: lDisc, type: 'Auto' });
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
  }, [cart, couponCode, manualDiscountIds, rejectedAutoDiscountIds, cgstRate, sgstRate, discountRules, products, activeCustomer]);"""

content = re.sub(old_useMemo_pattern, new_useMemo, content, flags=re.DOTALL)

# 2. Replace the modal buttons
old_modal_buttons_pattern = r"""                          <button
                            disabled=\{\!isEligible\}
                            onClick=\{\(\) => \{
                              if \(rule\.offerType === 'Coupon'\) \{
                                setCouponCode\(rule\.offerName\);
                                setAppliedDiscountName\(rule\.offerName\);
                              \} else \{
                                const calcDiscount = rule\.discountType === 'Flat' \? rule\.discountValue : Math\.floor\(subTotal \* \(rule\.discountValue \/ 100\)\);
                                setFlatDiscount\(calcDiscount\);
                                setAppliedDiscountName\(rule\.offerName\);
                                setCancelAutoDiscount\(true\);
                                onAddNotification\("Success", `Applied \$\{rule\.offerName\} \(\$\{calcDiscount\} OFF\)`\, "success"\);
                              \}
                              setShowDiscountSelectionModal\(false\);
                            \}\}
                            className=\{\`px-5 py-2\.5 rounded-xl font-bold whitespace-nowrap transition-colors \$\{isEligible \? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed'\}\`\}
                          >
                            Apply Offer
                          </button>"""

new_modal_buttons = """                          <button
                            disabled={!isEligible}
                            onClick={() => {
                              const rId = rule._id || rule.id;
                              if (manualDiscountIds.includes(rId)) {
                                setManualDiscountIds(prev => prev.filter(id => id !== rId));
                              } else {
                                setManualDiscountIds(prev => [...prev, rId]);
                                onAddNotification("Success", `Applied ${rule.offerName}`, "success");
                              }
                            }}
                            className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors ${isEligible ? (manualDiscountIds.includes(rule._id || rule.id) ? 'bg-emerald-500 text-white shadow-md cursor-pointer' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 cursor-pointer') : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                          >
                            {manualDiscountIds.includes(rule._id || rule.id) ? 'Applied (Remove)' : 'Apply Offer'}
                          </button>"""

content = re.sub(old_modal_buttons_pattern, new_modal_buttons, content, flags=re.DOTALL)

with open('Frontend/src/components/BillingPOSView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Modifications done via Python.")
