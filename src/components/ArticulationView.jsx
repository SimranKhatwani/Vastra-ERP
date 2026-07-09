import React, { useState } from "react";
import {
  Sparkles,
  Ruler,
  Scissors,
  ChevronRight,
  Check,
  Cpu,
} from "lucide-react";

export const ArticulationView = ({ onAddCustomToCart, onAddNotification }) => {
  // Bespoke form options
  const fabricPrices = {
    "Egyptian Cotton": 1200,
    "Pure Linen": 1600,
    "Mulberry Silk": 2800,
    "Denim Denim": 1100,
    "Merino Wool": 2400,
    "Viscose Rayon": 900,
    "Satin Silk": 1800,
    "Cashmere Blend": 3200,
    "Georgette Chiffon": 1000,
  };

  const fabrics = Object.keys(fabricPrices);
  const colors = [
    { name: "Crimson Red", hex: "#dc2626" },
    { name: "Royal Blue", hex: "#2563eb" },
    { name: "Forest Green", hex: "#16a34a" },
    { name: "Midnight Black", hex: "#0f172a" },
    { name: "Classic White", hex: "#f8fafc" },
    { name: "Ivory Cream", hex: "#fef3c7" },
    { name: "Charcoal Gray", hex: "#4b5563" },
    { name: "Burgundy Wine", hex: "#881337" },
  ];

  const patterns = [
    "Solid Plain",
    "Classic Stripes",
    "Windowpane Checks",
    "Floral Motif",
    "Self-Weave Textured",
  ];
  const sleeveTypes = [
    "Full Sleeves",
    "Half Sleeves",
    "Sleeveless",
    "Three-Quarter",
  ];
  const neckTypes = [
    "Standard Collar",
    "Mandarin Collar",
    "Crew Neck",
    "V-Neck",
    "Double Button Band",
  ];

  // Stateful Selections
  const [selectedFabric, setSelectedFabric] = useState("Egyptian Cotton");
  const [selectedColor, setSelectedColor] = useState(colors[1]); // Royal Blue
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedPattern, setSelectedPattern] = useState("Solid Plain");
  const [selectedSleeve, setSelectedSleeve] = useState("Full Sleeves");
  const [selectedNeck, setSelectedNeck] = useState("Standard Collar");
  const [embroidery, setEmbroidery] = useState(false);
  const [logoPrinting, setLogoPrinting] = useState(false);
  const [alterationCharges, setAlterationCharges] = useState(150);

  // Measurements
  const [chest, setChest] = useState(40);
  const [waist, setWaist] = useState(36);
  const [length, setLength] = useState(28);
  const [shoulder, setShoulder] = useState(18);
  const [sleeves, setSleeves] = useState(24);

  const [specialInstructions, setSpecialInstructions] = useState("");

  // Calculate pricing based on options
  const calculateCost = () => {
    const baseFabricCost = fabricPrices[selectedFabric] || 1000;
    let extraCosts = 0;
    if (embroidery) extraCosts += 450;
    if (logoPrinting) extraCosts += 250;
    if (selectedSleeve === "Full Sleeves") extraCosts += 100;
    if (selectedFabric === "Mulberry Silk") extraCosts += 300; // tailoring charge for fine silk

    return baseFabricCost + extraCosts + alterationCharges;
  };

  const estimatedCost = calculateCost();

  const handlePushToPOS = () => {
    const customGarment = {
      fabric: selectedFabric,
      color: selectedColor.name,
      size: selectedSize,
      pattern: selectedPattern,
      sleeveType: selectedSleeve,
      neckType: selectedNeck,
      embroidery,
      logoPrinting,
      alterationCharges,
      measurements: { chest, waist, length, shoulder, sleeves },
      specialInstructions,
      estimatedCost,
    };

    onAddCustomToCart(customGarment);
    onAddNotification(
      "Bespoke Engineering",
      `Articulated custom ${selectedFabric} (${selectedSize}) sent to POS billing line.`,
      "success",
    );
  };

  return (
    <div
      className="space-y-6 animate-fade-in pb-12"
      id="articulation-builder-root"
    >
      {/* Module Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 uppercase tracking-wider">
          Garment Articulation & Bespoke Studio
        </h1>
        <p className="text-xs text-slate-400">
          Configure fabric weaves, custom tailoring dimensions, and structural
          embellishments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Configuration Form (col-span-8) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:col-span-8 space-y-6">
          {/* Section 1: Fabric and Color Weaves */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Fabric & Hue Selection</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1.5">
                  Fabric Composition *
                </label>
                <select
                  value={selectedFabric}
                  onChange={(e) => setSelectedFabric(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {fabrics.map((fab, idx) => (
                    <option key={idx} value={fab}>
                      {fab} (Base ₹{fabricPrices[fab]})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1.5">
                  Fabric Pattern Structure
                </label>
                <select
                  value={selectedPattern}
                  onChange={(e) => setSelectedPattern(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {patterns.map((pat, idx) => (
                    <option key={idx} value={pat}>
                      {pat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Color Selector Swatches */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500">
                Dye Batch & Color Shade
              </label>
              <div className="flex flex-wrap gap-2.5">
                {colors.map((c, idx) => {
                  const isSelected = selectedColor.name === c.name;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedColor(c)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${isSelected ? "border-blue-500 bg-blue-50/40 text-blue-800 shadow-xs" : "border-slate-100 bg-white text-slate-600 hover:bg-slate-50"}`}
                    >
                      <div
                        className="w-4.5 h-4.5 rounded-md border border-slate-200"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 ml-1 text-blue-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Cut, Style, Collar & Sleeves */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Scissors className="w-4 h-4 text-blue-600" />
              <span>Garment Style & Cut Config</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1.5">
                  Sleeve Cut Type
                </label>
                <select
                  value={selectedSleeve}
                  onChange={(e) => setSelectedSleeve(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  {sleeveTypes.map((sl, idx) => (
                    <option key={idx} value={sl}>
                      {sl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1.5">
                  Collar/Neck Style
                </label>
                <select
                  value={selectedNeck}
                  onChange={(e) => setSelectedNeck(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  {neckTypes.map((nk, idx) => (
                    <option key={idx} value={nk}>
                      {nk}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1.5">
                  Base Sizing Blueprint
                </label>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                  {["S", "M", "L", "XL", "XXL"].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`w-full py-1.5 text-xs font-bold rounded-lg cursor-pointer ${selectedSize === sz ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Bespoke Dimensions (Measurements Drawer) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Ruler className="w-4 h-4 text-blue-600" />
              <span>Tailoring Blueprint & Measurements (Inches)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100/60">
                <span className="text-slate-400 block font-mono">Chest</span>
                <input
                  type="number"
                  value={chest}
                  onChange={(e) => setChest(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono font-bold text-slate-800 text-center"
                />
              </div>

              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100/60">
                <span className="text-slate-400 block font-mono">Waist</span>
                <input
                  type="number"
                  value={waist}
                  onChange={(e) => setWaist(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono font-bold text-slate-800 text-center"
                />
              </div>

              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100/60">
                <span className="text-slate-400 block font-mono">Length</span>
                <input
                  type="number"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono font-bold text-slate-800 text-center"
                />
              </div>

              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100/60">
                <span className="text-slate-400 block font-mono">Shoulder</span>
                <input
                  type="number"
                  value={shoulder}
                  onChange={(e) => setShoulder(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono font-bold text-slate-800 text-center"
                />
              </div>

              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100/60">
                <span className="text-slate-400 block font-mono">Sleeves</span>
                <input
                  type="number"
                  value={sleeves}
                  onChange={(e) => setSleeves(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono font-bold text-slate-800 text-center"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Embellishments & Extra Charges */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>Embellishments & Alterations</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-700 block">
                    Zari Embroidery
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    +₹450 Charge
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={embroidery}
                  onChange={() => setEmbroidery(!embroidery)}
                  className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-700 block">
                    Logo / Silk Screen
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    +₹250 Charge
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={logoPrinting}
                  onChange={() => setLogoPrinting(!logoPrinting)}
                  className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Tailor Alteration Surcharge
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-semibold font-mono">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={alterationCharges || ""}
                    onChange={(e) =>
                      setAlterationCharges(Math.max(0, Number(e.target.value)))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-6.5 pr-3 py-2 font-mono font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Special tailoring instruction box */}
            <div className="space-y-1.5 text-xs">
              <label className="block text-slate-500 font-semibold">
                Special Instructions for Tailoring Line
              </label>
              <textarea
                placeholder="e.g. Add extra copper buttons, double cuff stitching, side slits 4 inches..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-semibold text-slate-700 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Garment Preview Blueprint & Estimated Cost (col-span-4) */}
        <div className="space-y-5 lg:col-span-4">
          <div className="bg-slate-900 rounded-2xl shadow-xl text-white p-6 space-y-6 border border-slate-800 relative overflow-hidden">
            {/* Ambient Background Glow matching canvas guidelines */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-1">
              <span className="text-[9px] font-mono tracking-widest text-indigo-400 uppercase">
                Live Articulated Spec
              </span>
              <h3 className="text-base font-bold tracking-tight">
                Interactive Visual Blueprint
              </h3>
            </div>

            {/* Visual SVG mock of garment specification */}
            <div className="h-44 border border-slate-800 rounded-xl bg-slate-950/80 flex flex-col items-center justify-center p-4 relative font-mono text-[11px] text-slate-400">
              {/* Simple stylized SVG Garment hanger / outline icon representation */}
              <div className="flex flex-col items-center space-y-1">
                <Scissors className="w-10 h-10 text-indigo-400/80 mb-2 animate-pulse" />
                <span className="text-white font-bold">
                  {selectedFabric} Jacket / Shirt
                </span>
                <span className="text-slate-500 uppercase">
                  {selectedPattern} - {selectedColor.name}
                </span>
                <span className="bg-indigo-500/10 text-indigo-400 text-[10px] px-2 py-0.5 rounded-full border border-indigo-500/20 font-sans font-semibold mt-1">
                  Size {selectedSize} Blueprinted
                </span>
              </div>

              {/* Quick dimension badge display */}
              <div className="absolute bottom-3 inset-x-3 flex justify-around text-[10px] bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-400">
                <div>C: {chest}"</div>
                <div>W: {waist}"</div>
                <div>L: {length}"</div>
                <div>S: {shoulder}"</div>
              </div>
            </div>

            {/* Spec breakdown list */}
            <div className="space-y-2.5 text-xs text-slate-300 font-mono">
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-500">Fabric base</span>
                <span>{selectedFabric}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-500">Sleeve outline</span>
                <span>{selectedSleeve}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-500">Collar neckline</span>
                <span>{selectedNeck}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-500">Zari Embroidery</span>
                <span
                  className={embroidery ? "text-emerald-400" : "text-slate-600"}
                >
                  {embroidery ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-500">Screen logo</span>
                <span
                  className={
                    logoPrinting ? "text-emerald-400" : "text-slate-600"
                  }
                >
                  {logoPrinting ? "Yes" : "No"}
                </span>
              </div>
            </div>

            {/* Cost Summary Box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Customization Estimate:</span>
                <span className="font-mono text-slate-300">
                  ₹{estimatedCost}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold border-t border-slate-800 pt-2 text-white">
                <span>Calculated Unit Cost</span>
                <span className="font-mono text-indigo-400 text-lg">
                  ₹{estimatedCost}
                </span>
              </div>
            </div>

            {/* Action dispatch button */}
            <button
              onClick={handlePushToPOS}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-indigo-900/30 cursor-pointer"
            >
              <span>Compile & Send to POS Bill</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
