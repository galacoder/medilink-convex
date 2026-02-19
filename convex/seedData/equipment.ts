/**
 * Seed data: Equipment categories, equipment items, and consumables
 * vi: "Dữ liệu mẫu: Thiết bị y tế" / en: "Seed data: Medical equipment"
 *
 * 4 categories, 12 equipment items (mixed statuses), 3 consumables
 */

// ---------------------------------------------------------------------------
// Equipment categories
// ---------------------------------------------------------------------------

export interface SeedEquipmentCategory {
  nameVi: string;
  nameEn: string;
  descriptionVi?: string;
  descriptionEn?: string;
}

// vi: "Danh mục 1: Thiết bị chẩn đoán"
export const CATEGORY_DIAGNOSTIC: SeedEquipmentCategory = {
  nameVi: "Thiết bị chẩn đoán",
  nameEn: "Diagnostic Equipment",
  descriptionVi: "Thiết bị dùng để chẩn đoán bệnh lý và theo dõi chức năng cơ thể",
  descriptionEn: "Equipment used for disease diagnosis and body function monitoring",
};

// vi: "Danh mục 2: Thiết bị theo dõi bệnh nhân"
export const CATEGORY_PATIENT_MONITORING: SeedEquipmentCategory = {
  nameVi: "Thiết bị theo dõi bệnh nhân",
  nameEn: "Patient Monitoring Equipment",
  descriptionVi: "Thiết bị theo dõi các chỉ số sinh tồn của bệnh nhân liên tục",
  descriptionEn: "Equipment for continuous monitoring of patient vital signs",
};

// vi: "Danh mục 3: Dụng cụ phẫu thuật"
export const CATEGORY_SURGICAL: SeedEquipmentCategory = {
  nameVi: "Dụng cụ phẫu thuật",
  nameEn: "Surgical Instruments",
  descriptionVi: "Dụng cụ và thiết bị dùng trong phẫu thuật và thủ thuật y tế",
  descriptionEn: "Instruments and devices used in surgical and medical procedures",
};

// vi: "Danh mục 4: Thiết bị CNTT y tế"
export const CATEGORY_MEDICAL_IT: SeedEquipmentCategory = {
  nameVi: "Thiết bị CNTT y tế",
  nameEn: "Medical IT Equipment",
  descriptionVi: "Hệ thống công nghệ thông tin hỗ trợ quản lý và vận hành y tế",
  descriptionEn: "Information technology systems supporting healthcare management and operations",
};

export const ALL_SEED_CATEGORIES: SeedEquipmentCategory[] = [
  CATEGORY_DIAGNOSTIC,
  CATEGORY_PATIENT_MONITORING,
  CATEGORY_SURGICAL,
  CATEGORY_MEDICAL_IT,
];

// ---------------------------------------------------------------------------
// Equipment items
// ---------------------------------------------------------------------------

export interface SeedEquipment {
  nameVi: string;
  nameEn: string;
  descriptionVi?: string;
  descriptionEn?: string;
  categoryKey: "diagnostic" | "patient_monitoring" | "surgical" | "medical_it";
  status: "available" | "in_use" | "maintenance" | "damaged" | "retired";
  condition: "excellent" | "good" | "fair" | "poor";
  criticality: "A" | "B" | "C";
  serialNumber: string;
  model: string;
  manufacturer: string;
  location?: string;
  purchaseDate?: number;
  warrantyExpiryDate?: number;
}

const NOW = Date.now();
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// 6 available items
export const EQUIPMENT_ULTRASOUND: SeedEquipment = {
  nameVi: "Máy siêu âm tổng quát",
  nameEn: "General Ultrasound Machine",
  descriptionVi: "Máy siêu âm dùng để chẩn đoán hình ảnh tổng quát",
  descriptionEn: "Ultrasound machine for general imaging diagnostics",
  categoryKey: "diagnostic",
  status: "available",
  condition: "excellent",
  criticality: "A",
  serialNumber: "SN-US-001",
  model: "LOGIQ E10",
  manufacturer: "GE Healthcare",
  location: "Phòng chẩn đoán hình ảnh / Imaging Room 1",
  purchaseDate: NOW - 2 * ONE_YEAR_MS,
  warrantyExpiryDate: NOW + ONE_YEAR_MS,
};

export const EQUIPMENT_ECG: SeedEquipment = {
  nameVi: "Máy đo điện tim 12 chuyển đạo",
  nameEn: "12-Lead ECG Machine",
  descriptionVi: "Máy điện tâm đồ để ghi nhận hoạt động điện của tim",
  descriptionEn: "Electrocardiograph machine for recording cardiac electrical activity",
  categoryKey: "diagnostic",
  status: "available",
  condition: "good",
  criticality: "A",
  serialNumber: "SN-ECG-001",
  model: "MAC 5500 HD",
  manufacturer: "GE Healthcare",
  location: "Phòng tim mạch / Cardiology Room",
  purchaseDate: NOW - 3 * ONE_YEAR_MS,
  warrantyExpiryDate: NOW + 2 * ONE_YEAR_MS,
};

export const EQUIPMENT_PULSE_OXIMETER: SeedEquipment = {
  nameVi: "Máy đo SpO2",
  nameEn: "Pulse Oximeter",
  descriptionVi: "Thiết bị đo nồng độ oxy trong máu và nhịp tim",
  descriptionEn: "Device for measuring blood oxygen saturation and heart rate",
  categoryKey: "patient_monitoring",
  status: "available",
  condition: "good",
  criticality: "B",
  serialNumber: "SN-SPO-001",
  model: "Nellcor PM10N",
  manufacturer: "Medtronic",
  location: "Kho thiết bị / Equipment Storage",
  purchaseDate: NOW - ONE_YEAR_MS,
  warrantyExpiryDate: NOW + 2 * ONE_YEAR_MS,
};

export const EQUIPMENT_PATIENT_MONITOR: SeedEquipment = {
  nameVi: "Monitor theo dõi bệnh nhân đa chỉ số",
  nameEn: "Multi-parameter Patient Monitor",
  descriptionVi: "Hệ thống theo dõi liên tục các chỉ số sinh tồn đa thông số",
  descriptionEn: "Continuous multi-parameter vital signs monitoring system",
  categoryKey: "patient_monitoring",
  status: "available",
  condition: "excellent",
  criticality: "A",
  serialNumber: "SN-MON-001",
  model: "IntelliVue MX750",
  manufacturer: "Philips",
  location: "Phòng hồi sức / ICU Room",
  purchaseDate: NOW - 2 * ONE_YEAR_MS,
  warrantyExpiryDate: NOW + ONE_YEAR_MS,
};

export const EQUIPMENT_DEFIBRILLATOR: SeedEquipment = {
  nameVi: "Máy sốc điện tim",
  nameEn: "Defibrillator",
  descriptionVi: "Thiết bị phục hồi nhịp tim bình thường bằng dòng điện",
  descriptionEn: "Device that restores normal heart rhythm using electrical current",
  categoryKey: "patient_monitoring",
  status: "available",
  condition: "excellent",
  criticality: "A",
  serialNumber: "SN-DEF-001",
  model: "LifePak 15",
  manufacturer: "Stryker",
  location: "Phòng cấp cứu / Emergency Room",
  purchaseDate: NOW - ONE_YEAR_MS,
  warrantyExpiryDate: NOW + 3 * ONE_YEAR_MS,
};

export const EQUIPMENT_SURGICAL_LIGHT: SeedEquipment = {
  nameVi: "Đèn phẫu thuật LED",
  nameEn: "LED Surgical Light",
  descriptionVi: "Đèn chiếu sáng chuyên dụng cho phòng mổ",
  descriptionEn: "Specialized lighting system for operating rooms",
  categoryKey: "surgical",
  status: "available",
  condition: "good",
  criticality: "B",
  serialNumber: "SN-SL-001",
  model: "Surgilux 700",
  manufacturer: "Welch Allyn",
  location: "Phòng mổ 1 / Operating Room 1",
  purchaseDate: NOW - 4 * ONE_YEAR_MS,
  warrantyExpiryDate: NOW - ONE_YEAR_MS, // Expired warranty (intentional)
};

// 2 in_use items
export const EQUIPMENT_INFUSION_PUMP: SeedEquipment = {
  nameVi: "Máy bơm tiêm tự động",
  nameEn: "Infusion Pump",
  descriptionVi: "Thiết bị truyền dịch và thuốc chính xác vào cơ thể bệnh nhân",
  descriptionEn: "Device for precise delivery of fluids and medications to patients",
  categoryKey: "patient_monitoring",
  status: "in_use",
  condition: "good",
  criticality: "A",
  serialNumber: "SN-IP-001",
  model: "Alaris GP",
  manufacturer: "BD Medical",
  location: "Phòng điều trị / Treatment Room",
  purchaseDate: NOW - 2 * ONE_YEAR_MS,
  warrantyExpiryDate: NOW + ONE_YEAR_MS,
};

export const EQUIPMENT_ENDOSCOPE: SeedEquipment = {
  nameVi: "Máy nội soi ống mềm",
  nameEn: "Flexible Endoscope",
  descriptionVi: "Ống nội soi mềm dùng để kiểm tra và điều trị bên trong cơ thể",
  descriptionEn: "Flexible endoscope for internal examination and treatment",
  categoryKey: "diagnostic",
  status: "in_use",
  condition: "good",
  criticality: "B",
  serialNumber: "SN-END-001",
  model: "Olympus EVIS X1",
  manufacturer: "Olympus",
  location: "Phòng nội soi / Endoscopy Suite",
  purchaseDate: NOW - 3 * ONE_YEAR_MS,
  warrantyExpiryDate: NOW + 2 * ONE_YEAR_MS,
};

// 2 maintenance items
export const EQUIPMENT_XRAY: SeedEquipment = {
  nameVi: "Máy X-quang kỹ thuật số",
  nameEn: "Digital X-Ray Machine",
  descriptionVi: "Hệ thống chụp X-quang kỹ thuật số hiện đại",
  descriptionEn: "Modern digital radiography system",
  categoryKey: "diagnostic",
  status: "maintenance",
  condition: "fair",
  criticality: "A",
  serialNumber: "SN-XR-001",
  model: "RADspeed Pro",
  manufacturer: "Shimadzu",
  location: "Phòng X-quang / Radiology Room",
  purchaseDate: NOW - 5 * ONE_YEAR_MS,
  warrantyExpiryDate: NOW - 2 * ONE_YEAR_MS, // Expired warranty
};

export const EQUIPMENT_AUTOCLAVE: SeedEquipment = {
  nameVi: "Nồi hấp tiệt trùng",
  nameEn: "Autoclave Sterilizer",
  descriptionVi: "Thiết bị tiệt trùng dụng cụ y tế bằng hơi nước áp suất cao",
  descriptionEn: "High-pressure steam sterilization unit for medical instruments",
  categoryKey: "surgical",
  status: "maintenance",
  condition: "fair",
  criticality: "B",
  serialNumber: "SN-AC-001",
  model: "Prestige Medical Classic",
  manufacturer: "Prestige Medical",
  location: "Phòng tiệt trùng / Sterilization Room",
  purchaseDate: NOW - 6 * ONE_YEAR_MS,
  warrantyExpiryDate: NOW - 3 * ONE_YEAR_MS,
};

// 1 damaged item
export const EQUIPMENT_VENTILATOR: SeedEquipment = {
  nameVi: "Máy thở ICU",
  nameEn: "ICU Ventilator",
  descriptionVi: "Máy hỗ trợ hô hấp cho bệnh nhân tại phòng hồi sức tích cực",
  descriptionEn: "Mechanical ventilator for ICU respiratory support",
  categoryKey: "patient_monitoring",
  status: "damaged",
  condition: "poor",
  criticality: "A",
  serialNumber: "SN-VENT-001",
  model: "PB980",
  manufacturer: "Medtronic",
  location: "Kho hỏng / Damaged Equipment Storage",
  purchaseDate: NOW - 7 * ONE_YEAR_MS,
  warrantyExpiryDate: NOW - 4 * ONE_YEAR_MS,
};

// 1 retired item
export const EQUIPMENT_OLD_ECG: SeedEquipment = {
  nameVi: "Máy điện tim cũ (Đã thanh lý)",
  nameEn: "Legacy ECG Machine (Retired)",
  descriptionVi: "Máy điện tim thế hệ cũ đã được thanh lý, thay thế bằng thiết bị hiện đại",
  descriptionEn: "Legacy ECG machine, retired and replaced with modern equipment",
  categoryKey: "diagnostic",
  status: "retired",
  condition: "poor",
  criticality: "C",
  serialNumber: "SN-ECG-OLD-001",
  model: "MAC 5000",
  manufacturer: "GE Healthcare",
  location: "Kho thanh lý / Retired Equipment Storage",
  purchaseDate: NOW - 10 * ONE_YEAR_MS,
  warrantyExpiryDate: NOW - 7 * ONE_YEAR_MS,
};

export const ALL_SEED_EQUIPMENT: SeedEquipment[] = [
  EQUIPMENT_ULTRASOUND,       // available
  EQUIPMENT_ECG,              // available
  EQUIPMENT_PULSE_OXIMETER,   // available
  EQUIPMENT_PATIENT_MONITOR,  // available
  EQUIPMENT_DEFIBRILLATOR,    // available
  EQUIPMENT_SURGICAL_LIGHT,   // available
  EQUIPMENT_INFUSION_PUMP,    // in_use
  EQUIPMENT_ENDOSCOPE,        // in_use
  EQUIPMENT_XRAY,             // maintenance (will have overdue maintenance record)
  EQUIPMENT_AUTOCLAVE,        // maintenance
  EQUIPMENT_VENTILATOR,       // damaged
  EQUIPMENT_OLD_ECG,          // retired
];

// ---------------------------------------------------------------------------
// Consumables
// ---------------------------------------------------------------------------

export interface SeedConsumable {
  nameVi: string;
  nameEn: string;
  descriptionVi?: string;
  descriptionEn?: string;
  sku?: string;
  manufacturer?: string;
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
  maxLevel?: number;
  reorderPoint: number;
  unitCost?: number;
}

// vi: "Găng tay y tế dùng một lần" / en: "Disposable medical gloves"
export const CONSUMABLE_GLOVES: SeedConsumable = {
  nameVi: "Găng tay y tế dùng một lần",
  nameEn: "Disposable Medical Gloves",
  descriptionVi: "Găng tay nitrile dùng một lần, không latex, kích cỡ M",
  descriptionEn: "Single-use nitrile gloves, latex-free, size M",
  sku: "CONS-GL-M-001",
  manufacturer: "Ansell",
  unitOfMeasure: "hộp 100 chiếc / box of 100",
  categoryType: "disposables",
  currentStock: 150,
  parLevel: 50,
  maxLevel: 300,
  reorderPoint: 75,
  unitCost: 85000, // VND
};

// vi: "Điện cực ECG dùng một lần" / en: "Single-use ECG electrodes"
export const CONSUMABLE_ECG_ELECTRODES: SeedConsumable = {
  nameVi: "Điện cực ECG dùng một lần",
  nameEn: "Single-use ECG Electrodes",
  descriptionVi: "Điện cực tự dính dùng một lần cho máy điện tim",
  descriptionEn: "Self-adhesive single-use electrodes for ECG machines",
  sku: "CONS-ECG-EL-001",
  manufacturer: "3M",
  unitOfMeasure: "gói 50 miếng / pack of 50",
  categoryType: "electrodes",
  currentStock: 40,
  parLevel: 20,
  maxLevel: 100,
  reorderPoint: 30,
  unitCost: 120000, // VND
};

// vi: "Dung dịch khử khuẩn thiết bị" / en: "Medical device disinfectant"
export const CONSUMABLE_DISINFECTANT: SeedConsumable = {
  nameVi: "Dung dịch khử khuẩn thiết bị y tế",
  nameEn: "Medical Device Disinfectant Solution",
  descriptionVi: "Dung dịch khử khuẩn cấp độ cao dùng cho bề mặt thiết bị y tế",
  descriptionEn: "High-level disinfectant solution for medical device surfaces",
  sku: "CONS-DIS-001",
  manufacturer: "Metrex",
  unitOfMeasure: "chai 1 lít / 1L bottle",
  categoryType: "cleaning_agents",
  currentStock: 25,
  parLevel: 10,
  maxLevel: 60,
  reorderPoint: 15,
  unitCost: 350000, // VND
};

export const ALL_SEED_CONSUMABLES: SeedConsumable[] = [
  CONSUMABLE_GLOVES,
  CONSUMABLE_ECG_ELECTRODES,
  CONSUMABLE_DISINFECTANT,
];
