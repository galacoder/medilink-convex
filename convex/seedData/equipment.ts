/**
 * Seed data constants for equipment categories and equipment items.
 * vi: "Dữ liệu mẫu cho danh mục và thiết bị" / en: "Seed data for equipment categories and items"
 *
 * Equipment count: 12 items
 *   - 6 available
 *   - 2 in_use
 *   - 2 maintenance
 *   - 1 damaged
 *   - 1 retired
 */

// ---------------------------------------------------------------------------
// Equipment category constants
// ---------------------------------------------------------------------------

export const CATEGORY_DIAGNOSTIC = {
  nameVi: "Chẩn đoán",
  nameEn: "Diagnostic",
  descriptionVi: "Thiết bị chẩn đoán hình ảnh và xét nghiệm",
  descriptionEn: "Diagnostic imaging and laboratory equipment",
};

export const CATEGORY_PATIENT_MONITORING = {
  nameVi: "Theo dõi bệnh nhân",
  nameEn: "Patient Monitoring",
  descriptionVi: "Thiết bị theo dõi các thông số sinh lý bệnh nhân",
  descriptionEn: "Equipment for monitoring patient physiological parameters",
};

export const CATEGORY_SURGICAL = {
  nameVi: "Phẫu thuật",
  nameEn: "Surgical",
  descriptionVi: "Thiết bị và dụng cụ phẫu thuật",
  descriptionEn: "Surgical equipment and instruments",
};

export const CATEGORY_MEDICAL_IT = {
  nameVi: "CNTT Y tế",
  nameEn: "Medical IT",
  descriptionVi: "Hệ thống công nghệ thông tin y tế",
  descriptionEn: "Medical information technology systems",
};

// ---------------------------------------------------------------------------
// Equipment item type
// categoryKey must match keys used in seedEquipmentData: diagnostic, patient_monitoring, surgical, medical_it
// ---------------------------------------------------------------------------

interface SeedEquipment {
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  descriptionEn: string;
  categoryKey: "diagnostic" | "patient_monitoring" | "surgical" | "medical_it";
  status: "available" | "in_use" | "maintenance" | "damaged" | "retired";
  condition: "excellent" | "good" | "fair" | "poor";
  criticality: "A" | "B" | "C";
  serialNumber: string;
  model: string;
  manufacturer: string;
  location: string;
  purchaseDate: number;
  warrantyExpiryDate: number;
}

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const TWO_YEARS_MS = 2 * ONE_YEAR_MS;
const NOW = 1700000000000; // Fixed reference timestamp for reproducible seeds (~Nov 2023)

// Equipment array — order matters! seedServiceRequestData maps by index position.
// EQUIPMENT_ULTRASOUND: 0, EQUIPMENT_ECG: 1, EQUIPMENT_PULSE_OXIMETER: 2,
// EQUIPMENT_PATIENT_MONITOR: 3, EQUIPMENT_DEFIBRILLATOR: 4, EQUIPMENT_SURGICAL_LIGHT: 5,
// EQUIPMENT_INFUSION_PUMP: 6, EQUIPMENT_ENDOSCOPE: 7, EQUIPMENT_XRAY: 8,
// EQUIPMENT_AUTOCLAVE: 9, EQUIPMENT_VENTILATOR: 10, EQUIPMENT_OLD_ECG: 11

export const ALL_SEED_EQUIPMENT: SeedEquipment[] = [
  // 0: EQUIPMENT_ULTRASOUND
  {
    nameVi: "Máy siêu âm",
    nameEn: "Ultrasound Machine",
    descriptionVi: "Máy siêu âm chẩn đoán hình ảnh tần số cao",
    descriptionEn: "High-frequency diagnostic ultrasound imaging machine",
    categoryKey: "diagnostic",
    status: "available",
    condition: "excellent",
    criticality: "A",
    serialNumber: "SN-US-001",
    model: "LOGIQ E10",
    manufacturer: "GE Healthcare",
    location: "Phòng siêu âm / Ultrasound Room",
    purchaseDate: NOW - TWO_YEARS_MS,
    warrantyExpiryDate: NOW + TWO_YEARS_MS,
  },
  // 1: EQUIPMENT_ECG
  {
    nameVi: "Máy điện tim",
    nameEn: "ECG Machine",
    descriptionVi: "Máy đo điện tâm đồ 12 chuyển đạo",
    descriptionEn: "12-lead electrocardiogram machine",
    categoryKey: "diagnostic",
    status: "available",
    condition: "good",
    criticality: "A",
    serialNumber: "SN-ECG-001",
    model: "MAC 5500 HD",
    manufacturer: "GE Healthcare",
    location: "Phòng tim mạch / Cardiology Room",
    purchaseDate: NOW - ONE_YEAR_MS,
    warrantyExpiryDate: NOW + ONE_YEAR_MS,
  },
  // 2: EQUIPMENT_PULSE_OXIMETER
  {
    nameVi: "Máy đo SpO2",
    nameEn: "Pulse Oximeter",
    descriptionVi: "Máy đo độ bão hòa oxy trong máu và nhịp tim",
    descriptionEn: "Blood oxygen saturation and heart rate monitor",
    categoryKey: "patient_monitoring",
    status: "available",
    condition: "excellent",
    criticality: "B",
    serialNumber: "SN-SPO-001",
    model: "Nellcor PM10N",
    manufacturer: "Medtronic",
    location: "Phòng cấp cứu / Emergency Room",
    purchaseDate: NOW - ONE_YEAR_MS,
    warrantyExpiryDate: NOW + TWO_YEARS_MS,
  },
  // 3: EQUIPMENT_PATIENT_MONITOR
  {
    nameVi: "Máy theo dõi bệnh nhân",
    nameEn: "Patient Monitor",
    descriptionVi: "Máy theo dõi các thông số sinh lý đa thông số",
    descriptionEn: "Multi-parameter patient physiological monitoring system",
    categoryKey: "patient_monitoring",
    status: "in_use",
    condition: "good",
    criticality: "A",
    serialNumber: "SN-PM-001",
    model: "IntelliVue MX450",
    manufacturer: "Philips",
    location: "Phòng ICU / ICU Room",
    purchaseDate: NOW - TWO_YEARS_MS,
    warrantyExpiryDate: NOW + ONE_YEAR_MS,
  },
  // 4: EQUIPMENT_DEFIBRILLATOR
  {
    nameVi: "Máy sốc điện tim",
    nameEn: "Defibrillator",
    descriptionVi: "Máy khử rung tim dùng trong cấp cứu tim mạch",
    descriptionEn: "Cardiac defibrillator for cardiovascular emergencies",
    categoryKey: "patient_monitoring",
    status: "available",
    condition: "excellent",
    criticality: "A",
    serialNumber: "SN-DEF-001",
    model: "ZOLL R Series",
    manufacturer: "ZOLL Medical",
    location: "Phòng cấp cứu / Emergency Room",
    purchaseDate: NOW - ONE_YEAR_MS,
    warrantyExpiryDate: NOW + TWO_YEARS_MS,
  },
  // 5: EQUIPMENT_SURGICAL_LIGHT
  {
    nameVi: "Đèn phẫu thuật",
    nameEn: "Surgical Light",
    descriptionVi: "Đèn chiếu sáng phòng mổ không bóng mờ",
    descriptionEn: "Shadow-free surgical room illumination light",
    categoryKey: "surgical",
    status: "available",
    condition: "good",
    criticality: "B",
    serialNumber: "SN-SL-001",
    model: "Integra Luxtec",
    manufacturer: "Integra LifeSciences",
    location: "Phòng phẫu thuật / Operating Room",
    purchaseDate: NOW - TWO_YEARS_MS,
    warrantyExpiryDate: NOW + ONE_YEAR_MS,
  },
  // 6: EQUIPMENT_INFUSION_PUMP
  {
    nameVi: "Máy truyền dịch",
    nameEn: "Infusion Pump",
    descriptionVi: "Máy bơm dịch truyền tĩnh mạch tốc độ chính xác",
    descriptionEn: "Precision intravenous fluid infusion pump",
    categoryKey: "surgical",
    status: "in_use",
    condition: "good",
    criticality: "A",
    serialNumber: "SN-IP-001",
    model: "Baxter Sigma Spectrum",
    manufacturer: "Baxter",
    location: "Phòng phẫu thuật / Operating Room",
    purchaseDate: NOW - ONE_YEAR_MS,
    warrantyExpiryDate: NOW + TWO_YEARS_MS,
  },
  // 7: EQUIPMENT_ENDOSCOPE
  {
    nameVi: "Máy nội soi",
    nameEn: "Endoscope",
    descriptionVi: "Hệ thống nội soi ống tiêu hóa linh hoạt",
    descriptionEn: "Flexible gastrointestinal endoscopy system",
    categoryKey: "diagnostic",
    status: "available",
    condition: "good",
    criticality: "B",
    serialNumber: "SN-END-001",
    model: "Olympus EVIS EXERA III",
    manufacturer: "Olympus",
    location: "Phòng nội soi / Endoscopy Room",
    purchaseDate: NOW - ONE_YEAR_MS,
    warrantyExpiryDate: NOW + ONE_YEAR_MS,
  },
  // 8: EQUIPMENT_XRAY (SN-XR-001 — receives overdue maintenance record)
  {
    nameVi: "Máy X-quang",
    nameEn: "X-Ray Machine",
    descriptionVi: "Máy chụp X-quang kỹ thuật số phòng khám",
    descriptionEn: "Digital clinic X-ray imaging machine",
    categoryKey: "diagnostic",
    status: "maintenance",
    condition: "fair",
    criticality: "A",
    serialNumber: "SN-XR-001",
    model: "Siemens MULTIX Impact",
    manufacturer: "Siemens Healthineers",
    location: "Phòng X-quang / X-Ray Room",
    purchaseDate: NOW - TWO_YEARS_MS * 2,
    warrantyExpiryDate: NOW - ONE_YEAR_MS, // Warranty expired
  },
  // 9: EQUIPMENT_AUTOCLAVE
  {
    nameVi: "Máy tiệt trùng hấp",
    nameEn: "Autoclave",
    descriptionVi: "Máy tiệt trùng dụng cụ y tế bằng hơi nước áp suất cao",
    descriptionEn: "High-pressure steam medical instrument sterilization machine",
    categoryKey: "surgical",
    status: "maintenance",
    condition: "fair",
    criticality: "B",
    serialNumber: "SN-AC-001",
    model: "Tuttnauer 3870EA",
    manufacturer: "Tuttnauer",
    location: "Phòng tiệt trùng / Sterilization Room",
    purchaseDate: NOW - TWO_YEARS_MS,
    warrantyExpiryDate: NOW + ONE_YEAR_MS,
  },
  // 10: EQUIPMENT_VENTILATOR
  {
    nameVi: "Máy thở",
    nameEn: "Ventilator",
    descriptionVi: "Máy hỗ trợ hô hấp cơ học ICU",
    descriptionEn: "ICU mechanical respiratory support ventilator",
    categoryKey: "patient_monitoring",
    status: "damaged",
    condition: "poor",
    criticality: "A",
    serialNumber: "SN-VT-001",
    model: "Dräger Evita V800",
    manufacturer: "Drägerwerk",
    location: "Phòng ICU / ICU Room",
    purchaseDate: NOW - TWO_YEARS_MS * 2,
    warrantyExpiryDate: NOW - TWO_YEARS_MS, // Long-expired warranty
  },
  // 11: EQUIPMENT_OLD_ECG
  {
    nameVi: "Máy điện tim cũ",
    nameEn: "ECG Machine (Old)",
    descriptionVi: "Máy điện tim 12 chuyển đạo đời cũ — đã ngừng sử dụng",
    descriptionEn: "Legacy 12-lead ECG machine — decommissioned",
    categoryKey: "diagnostic",
    status: "retired",
    condition: "poor",
    criticality: "C",
    serialNumber: "SN-ECG-OLD-001",
    model: "Nihon Kohden ECG-9130K",
    manufacturer: "Nihon Kohden",
    location: "Kho thiết bị / Equipment Storage",
    purchaseDate: NOW - TWO_YEARS_MS * 4,
    warrantyExpiryDate: NOW - TWO_YEARS_MS * 2,
  },
];

// ---------------------------------------------------------------------------
// Consumable item type
// ---------------------------------------------------------------------------

interface SeedConsumable {
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  descriptionEn: string;
  sku: string;
  manufacturer: string;
  unitOfMeasure: string;
  categoryType:
    | "disposables"
    | "reagents"
    | "electrodes"
    | "filters"
    | "lubricants"
    | "cleaning_agents"
    | "other";
  currentStock: number;
  parLevel: number;
  maxLevel: number;
  reorderPoint: number;
  unitCost: number;
}

export const ALL_SEED_CONSUMABLES: SeedConsumable[] = [
  {
    nameVi: "Găng tay cao su y tế",
    nameEn: "Medical Rubber Gloves",
    descriptionVi: "Găng tay cao su dùng một lần không có bột, cỡ M",
    descriptionEn: "Powder-free disposable rubber gloves, size M",
    sku: "SKU-GLV-001",
    manufacturer: "Ansell",
    unitOfMeasure: "hộp",
    categoryType: "disposables",
    currentStock: 150,
    parLevel: 50,
    maxLevel: 300,
    reorderPoint: 75,
    unitCost: 85000,
  },
  {
    nameVi: "Điện cực ECG dán",
    nameEn: "ECG Adhesive Electrodes",
    descriptionVi: "Điện cực dán cho máy điện tim, hộp 50 miếng",
    descriptionEn: "Adhesive electrodes for ECG machines, box of 50 pieces",
    sku: "SKU-ECG-EL-001",
    manufacturer: "3M",
    unitOfMeasure: "hộp",
    categoryType: "electrodes",
    currentStock: 30,
    parLevel: 20,
    maxLevel: 100,
    reorderPoint: 25,
    unitCost: 120000,
  },
  {
    nameVi: "Dung dịch khử trùng Cidex",
    nameEn: "Cidex Disinfectant Solution",
    descriptionVi: "Dung dịch khử trùng glutaraldehyde 2% dùng cho nội soi",
    descriptionEn: "2% glutaraldehyde disinfectant solution for endoscopy",
    sku: "SKU-CDX-001",
    manufacturer: "Ethicon",
    unitOfMeasure: "chai",
    categoryType: "cleaning_agents",
    currentStock: 8,
    parLevel: 10,
    maxLevel: 40,
    reorderPoint: 12,
    unitCost: 450000,
  },
];
