// Measurement Configuration & Garment Matrix for Vastra ERP Tailoring Module

export const GENTS_GARMENTS_CONFIG = {
  "Shirt": {
    label: "Shirt",
    fields: ["Chest", "Waist", "Shoulder", "Sleeve", "Length"],
    useInseam: false
  },
  "Pant / Trouser": {
    label: "Pant / Trouser",
    fields: ["Waist", "Hip", "Thigh", "Knee", "Bottom", "Inseam / Inner Leg Length"],
    useInseam: true
  },
  "Jeans": {
    label: "Jeans",
    fields: ["Waist", "Hip", "Thigh", "Knee", "Bottom", "Inseam / Inner Leg Length"],
    useInseam: true
  },
  "Pajama": {
    label: "Pajama",
    fields: ["Waist", "Hip", "Thigh", "Bottom", "Inseam / Inner Leg Length"],
    useInseam: true
  },
  "Kurta": {
    label: "Kurta",
    fields: ["Chest", "Waist", "Hip", "Shoulder", "Sleeve", "Length"],
    useInseam: false
  },
  "Suit / Coat": {
    label: "Suit / Coat",
    fields: ["Chest", "Waist", "Shoulder", "Sleeve", "Length"],
    useInseam: false
  },
  "Jodhpuri": {
    label: "Jodhpuri",
    fields: ["Chest", "Waist", "Shoulder", "Sleeve", "Length", "Hip", "Thigh", "Knee", "Bottom", "Inseam / Inner Leg Length"],
    useInseam: true
  },
  "Sherwani": {
    label: "Sherwani",
    fields: ["Chest", "Waist", "Hip", "Shoulder", "Sleeve", "Length", "Bottom", "Inseam / Inner Leg Length"],
    useInseam: true
  }
};

export const LADIES_GARMENTS_CONFIG = {
  "Blouse": {
    label: "Blouse",
    fields: ["Bust", "Underbust", "Waist", "Shoulder", "Sleeve", "Length"],
    useInseam: false
  },
  "Kurti / Suit": {
    label: "Kurti / Suit",
    fields: ["Bust", "Waist", "Hip", "Shoulder", "Sleeve", "Length"],
    useInseam: false
  },
  "Ladies Pant / Trouser": {
    label: "Ladies Pant / Trouser",
    fields: ["Waist", "Hip", "Thigh", "Knee", "Bottom", "Inseam / Inner Leg Length"],
    useInseam: true
  },
  "Palazzo": {
    label: "Palazzo",
    fields: ["Waist", "Hip", "Thigh", "Bottom", "Inseam / Inner Leg Length"],
    useInseam: true
  },
  "Salwar": {
    label: "Salwar",
    fields: ["Waist", "Hip", "Thigh", "Bottom", "Inseam / Inner Leg Length"],
    useInseam: true
  },
  "Churidar": {
    label: "Churidar",
    fields: ["Waist", "Hip", "Thigh", "Calf", "Bottom", "Inseam / Inner Leg Length"],
    useInseam: true
  },
  "Sharara / Gharara": {
    label: "Sharara / Gharara",
    fields: ["Waist", "Hip", "Thigh", "Bottom", "Ghera", "Inseam / Inner Leg Length"],
    useInseam: true
  },
  "Lehenga": {
    label: "Lehenga",
    fields: ["Waist", "Hip", "Length", "Ghera"],
    useInseam: false
  },
  "Gown / Dress": {
    label: "Gown / Dress",
    fields: ["Bust", "Waist", "Hip", "Shoulder", "Sleeve", "Full Length"],
    useInseam: false
  }
};

export const OPTIONAL_MEASUREMENT_FIELDS = [
  "Outseam",
  "Neck",
  "Armhole",
  "Wrist",
  "Front Cross",
  "Back Cross",
  "Ankle"
];

// Helper to detect garment type from product name & gender
export function detectGarmentType(productName = "", gender = "Gents") {
  const n = (productName || "").toLowerCase();
  const isLady = gender === "Ladies" || /(lady|women|saree|kurti|lehenga|suit|skirt|blouse|frock|gown)/i.test(n);

  if (/blouse/i.test(n)) return "Blouse";
  if (/kurti/i.test(n)) return "Kurti / Suit";
  if (/salwar/i.test(n)) return "Salwar";
  if (/palazzo/i.test(n)) return "Palazzo";
  if (/churidar/i.test(n)) return "Churidar";
  if (/sharara|gharara/i.test(n)) return "Sharara / Gharara";
  if (/lehenga/i.test(n)) return "Lehenga";
  if (/gown|frock|dress/i.test(n)) return "Gown / Dress";
  if (/jeans|denim/i.test(n)) return "Jeans";
  if (/pajama|pyjama/i.test(n)) return "Pajama";
  if (/jodhpuri/i.test(n)) return "Jodhpuri";
  if (/sherwani/i.test(n)) return "Sherwani";
  if (/pant|trouser|bottom/i.test(n)) return isLady ? "Ladies Pant / Trouser" : "Pant / Trouser";
  if (/suit|coat|blazer|tuxedo/i.test(n)) return isLady ? "Kurti / Suit" : "Suit / Coat";
  if (/kurta/i.test(n)) return "Kurta";
  if (/shirt/i.test(n)) return "Shirt";

  return isLady ? "Kurti / Suit" : "Shirt";
}

// Get fields list for a garment & gender
export function getGarmentMeasurementFields(garmentType, gender = "Gents") {
  const config = gender === "Ladies" ? LADIES_GARMENTS_CONFIG : GENTS_GARMENTS_CONFIG;
  if (config[garmentType]) {
    return config[garmentType].fields;
  }
  // Fallback to searching other gender config if not found
  const otherConfig = gender === "Ladies" ? GENTS_GARMENTS_CONFIG : LADIES_GARMENTS_CONFIG;
  if (otherConfig[garmentType]) {
    return otherConfig[garmentType].fields;
  }
  // Default general fields
  return gender === "Ladies"
    ? ["Bust", "Waist", "Hip", "Shoulder", "Sleeve", "Length"]
    : ["Chest", "Waist", "Shoulder", "Sleeve", "Length"];
}
