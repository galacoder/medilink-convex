/**
 * Seed data constants for hospital workflow tables.
 * vi: "Dữ liệu mẫu cho quy trình làm việc của bệnh viện"
 * en: "Seed data for hospital workflow tables"
 *
 * Tables populated:
 *   - departments          (3 hospital departments)
 *   - borrowRequests       (3 requests: pending, approved, returned)
 *   - failureReports       (2 reports: open high urgency + resolved medium)
 *   - equipmentHistory     (4 audit trail entries)
 *   - qrScanLog            (5 scan events: view, borrow, return, report_issue)
 *   - consumableUsageLog   (8 transaction entries)
 *   - reorderRequests      (3 reorders: pending, approved, received)
 *   - notifications        (5 notifications across user roles)
 */

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const NOW = 1700000000000; // Fixed reference timestamp for reproducible seeds (~Nov 2023)

// ---------------------------------------------------------------------------
// Departments (3 hospital departments)
// headUserKey references users: hospital_owner, hospital_staff_1, hospital_staff_2
// ---------------------------------------------------------------------------

interface SeedDepartment {
  name: string;
  description: string;
  headUserKey: "hospital_owner" | "hospital_staff_1" | "hospital_staff_2";
}

export const SEED_DEPARTMENTS: SeedDepartment[] = [
  {
    name: "Khoa Tim mạch",
    description:
      "Chăm sóc và điều trị bệnh tim mạch, quản lý thiết bị chẩn đoán và theo dõi tim mạch / Cardiology care and treatment, management of cardiac diagnostic and monitoring equipment",
    headUserKey: "hospital_owner",
  },
  {
    name: "Khoa Cấp cứu",
    description:
      "Xử lý các trường hợp khẩn cấp và cấp cứu, quản lý thiết bị cấp cứu và theo dõi bệnh nhân / Emergency and urgent care, management of emergency and patient monitoring equipment",
    headUserKey: "hospital_staff_1",
  },
  {
    name: "Khoa X-Quang",
    description:
      "Chẩn đoán hình ảnh y tế bao gồm X-quang và siêu âm / Medical imaging including X-ray and ultrasound diagnostics",
    headUserKey: "hospital_staff_2",
  },
];

// ---------------------------------------------------------------------------
// Borrow requests (3 — one per interesting status variant)
// equipmentIndex matches position in ALL_SEED_EQUIPMENT array
// requesterKey + approvedByKey reference userKeyMap
// ---------------------------------------------------------------------------

interface SeedBorrowRequest {
  equipmentIndex: number; // Index into equipmentIds[] array
  requesterKey: "hospital_owner" | "hospital_staff_1" | "hospital_staff_2";
  approvedByKey:
    | "hospital_owner"
    | "hospital_staff_1"
    | "hospital_staff_2"
    | null;
  status: "pending" | "approved" | "rejected" | "returned" | "cancelled";
  requestedStartDate: number;
  requestedEndDate: number;
  actualReturnDate?: number;
  notes: string;
  approvedAt?: number;
}

export const SEED_BORROW_REQUESTS: SeedBorrowRequest[] = [
  // Returned borrow request (complete cycle)
  {
    equipmentIndex: 5, // EQUIPMENT_SURGICAL_LIGHT
    requesterKey: "hospital_staff_1",
    approvedByKey: "hospital_owner",
    status: "returned",
    requestedStartDate: NOW - 20 * ONE_DAY_MS,
    requestedEndDate: NOW - 17 * ONE_DAY_MS,
    actualReturnDate: NOW - 16 * ONE_DAY_MS,
    notes:
      "Cần đèn phẫu thuật cho ca phẫu thuật dự phòng tại phòng mổ phụ / Need surgical light for backup operating room surgery",
    approvedAt: NOW - 21 * ONE_DAY_MS,
  },
  // Approved borrow request (currently in use)
  {
    equipmentIndex: 7, // EQUIPMENT_ENDOSCOPE
    requesterKey: "hospital_staff_2",
    approvedByKey: "hospital_owner",
    status: "approved",
    requestedStartDate: NOW - 3 * ONE_DAY_MS,
    requestedEndDate: NOW + 2 * ONE_DAY_MS,
    notes:
      "Mượn máy nội soi để kiểm tra định kỳ đường tiêu hóa cho nhóm bệnh nhân đặc biệt / Borrowing endoscope for routine gastrointestinal examinations for a special patient group",
    approvedAt: NOW - 4 * ONE_DAY_MS,
  },
  // Pending borrow request (waiting for approval)
  {
    equipmentIndex: 2, // EQUIPMENT_PULSE_OXIMETER
    requesterKey: "hospital_staff_1",
    approvedByKey: null,
    status: "pending",
    requestedStartDate: NOW + ONE_DAY_MS,
    requestedEndDate: NOW + 5 * ONE_DAY_MS,
    notes:
      "Cần thêm máy đo SpO2 cho phòng hồi sức sau phẫu thuật trong tuần tới / Need additional pulse oximeters for post-operative recovery room next week",
  },
];

// ---------------------------------------------------------------------------
// Failure reports (2 — open high urgency + resolved medium)
// equipmentIndex maps to ALL_SEED_EQUIPMENT positions
// reportedByKey + assignedToKey reference userKeyMap
// ---------------------------------------------------------------------------

interface SeedFailureReport {
  equipmentIndex: number; // Index into equipmentIds[] array
  urgency: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "closed" | "cancelled";
  descriptionVi: string;
  descriptionEn: string;
  reportedByKey: "hospital_owner" | "hospital_staff_1" | "hospital_staff_2";
  assignedToKey:
    | "hospital_owner"
    | "hospital_staff_1"
    | "hospital_staff_2"
    | null;
  resolvedAt?: number;
  resolutionNotes?: string;
  daysAgo: number;
}

export const SEED_FAILURE_REPORTS: SeedFailureReport[] = [
  // Open high-urgency failure (Ventilator — already damaged)
  {
    equipmentIndex: 10, // EQUIPMENT_VENTILATOR (damaged status)
    urgency: "high",
    status: "open",
    descriptionVi:
      "Máy thở Dräger Evita V800 phát hiện lỗi báo động áp suất — Áp suất đường thở hiển thị bất thường và không ổn định. Thiết bị đã được tắt ngay lập tức và bệnh nhân được chuyển sang máy thở dự phòng.",
    descriptionEn:
      "Dräger Evita V800 ventilator shows airway pressure alarm error — Airway pressure display is abnormal and unstable. Device was immediately turned off and patient was transferred to backup ventilator.",
    reportedByKey: "hospital_staff_2",
    assignedToKey: "hospital_owner",
    daysAgo: 5,
  },
  // Resolved medium-urgency failure (Autoclave — under maintenance)
  {
    equipmentIndex: 9, // EQUIPMENT_AUTOCLAVE (maintenance status)
    urgency: "medium",
    status: "resolved",
    descriptionVi:
      "Máy tiệt trùng Tuttnauer 3870EA không đạt áp suất tiệt trùng yêu cầu — Van xả hơi có dấu hiệu hở. Đã tạm ngừng sử dụng và chuyển sang máy tiệt trùng dự phòng.",
    descriptionEn:
      "Tuttnauer 3870EA autoclave not reaching required sterilization pressure — Steam exhaust valve shows signs of leakage. Temporarily out of service, switched to backup sterilizer.",
    reportedByKey: "hospital_staff_1",
    assignedToKey: "hospital_owner",
    resolvedAt: NOW - 2 * ONE_DAY_MS,
    resolutionNotes:
      "Đã thay thế van xả hơi và vòng đệm. Máy tiệt trùng đã kiểm tra và đạt áp suất yêu cầu 134°C / 3 bar. / Steam exhaust valve and gasket replaced. Autoclave tested and reaches required pressure of 134°C / 3 bar.",
    daysAgo: 10,
  },
];

// ---------------------------------------------------------------------------
// Equipment history entries (4 — status change audit trail)
// equipmentIndex maps to ALL_SEED_EQUIPMENT positions
// performedByKey references userKeyMap
// ---------------------------------------------------------------------------

interface SeedEquipmentHistory {
  equipmentIndex: number; // Index into equipmentIds[] array
  actionType: "status_change" | "maintenance" | "repair" | "inspection";
  previousStatus?: string;
  newStatus?: string;
  notes: string;
  performedByKey: "hospital_owner" | "hospital_staff_1" | "hospital_staff_2";
  daysAgo: number;
}

export const SEED_EQUIPMENT_HISTORY: SeedEquipmentHistory[] = [
  // X-Ray Machine: available → maintenance (started maintenance)
  {
    equipmentIndex: 8, // EQUIPMENT_XRAY
    actionType: "status_change",
    previousStatus: "available",
    newStatus: "maintenance",
    notes:
      "Máy X-quang đưa vào bảo trì định kỳ theo lịch — Đã quá 6 tháng kể từ lần bảo trì cuối / X-Ray machine placed into scheduled periodic maintenance — 6 months since last maintenance",
    performedByKey: "hospital_owner",
    daysAgo: 15,
  },
  // Ventilator: in_use → damaged (failure detected)
  {
    equipmentIndex: 10, // EQUIPMENT_VENTILATOR
    actionType: "status_change",
    previousStatus: "in_use",
    newStatus: "damaged",
    notes:
      "Máy thở phát hiện lỗi nghiêm trọng — Đã dừng sử dụng ngay lập tức sau khi báo cáo sự cố / Ventilator detected critical malfunction — Immediately stopped using after failure report",
    performedByKey: "hospital_staff_2",
    daysAgo: 5,
  },
  // Patient Monitor: inspection performed
  {
    equipmentIndex: 3, // EQUIPMENT_PATIENT_MONITOR
    actionType: "inspection",
    notes:
      "Kiểm tra định kỳ màn hình theo dõi bệnh nhân ICU — Tất cả thông số trong giới hạn bình thường. Hiệu chỉnh lại cảm biến nhiệt độ. / Routine inspection of ICU patient monitor — All parameters within normal limits. Temperature sensor recalibrated.",
    performedByKey: "hospital_staff_1",
    daysAgo: 30,
  },
  // Autoclave: maintenance performed
  {
    equipmentIndex: 9, // EQUIPMENT_AUTOCLAVE
    actionType: "repair",
    previousStatus: "maintenance",
    newStatus: "maintenance",
    notes:
      "Thay van xả hơi và vòng đệm cho máy tiệt trùng. Kiểm tra đạt yêu cầu 134°C / 3 bar. Vẫn đang trong giai đoạn bảo trì để theo dõi thêm. / Replaced steam exhaust valve and gasket. Testing meets 134°C / 3 bar requirement. Remains in maintenance phase for further monitoring.",
    performedByKey: "hospital_owner",
    daysAgo: 2,
  },
];

// ---------------------------------------------------------------------------
// QR scan log (5 scan events across different actions)
// qrCodeIndex: maps to equipment index (each equipment has a QR code)
// scannedByKey: references userKeyMap
// ---------------------------------------------------------------------------

interface SeedQrScanLog {
  equipmentIndex: number; // Equipment index — corresponding QR code will be looked up
  scannedByKey: "hospital_owner" | "hospital_staff_1" | "hospital_staff_2";
  action: "view" | "borrow" | "return" | "report_issue";
  metadata?: Record<string, string | number | boolean>;
  hoursAgo: number;
}

export const SEED_QR_SCAN_LOG: SeedQrScanLog[] = [
  // View scan — ultrasound status check
  {
    equipmentIndex: 0, // EQUIPMENT_ULTRASOUND
    scannedByKey: "hospital_staff_1",
    action: "view",
    metadata: {
      source: "mobile_app",
      deviceType: "android",
    },
    hoursAgo: 2,
  },
  // Borrow scan — endoscope
  {
    equipmentIndex: 7, // EQUIPMENT_ENDOSCOPE
    scannedByKey: "hospital_staff_2",
    action: "borrow",
    metadata: {
      source: "mobile_app",
      borrowRequestInitiated: true,
    },
    hoursAgo: 72, // 3 days ago
  },
  // Return scan — endoscope return
  {
    equipmentIndex: 5, // EQUIPMENT_SURGICAL_LIGHT
    scannedByKey: "hospital_staff_1",
    action: "return",
    metadata: {
      source: "mobile_app",
      returnedOn: NOW - 16 * 24 * 60 * 60 * 1000,
    },
    hoursAgo: 384, // 16 days ago
  },
  // Report issue scan — ventilator failure
  {
    equipmentIndex: 10, // EQUIPMENT_VENTILATOR
    scannedByKey: "hospital_staff_2",
    action: "report_issue",
    metadata: {
      source: "mobile_app",
      issueCategory: "equipment_failure",
      urgency: "high",
    },
    hoursAgo: 120, // 5 days ago
  },
  // View scan — ECG status check
  {
    equipmentIndex: 1, // EQUIPMENT_ECG
    scannedByKey: "hospital_owner",
    action: "view",
    metadata: {
      source: "tablet_app",
      auditInspection: true,
    },
    hoursAgo: 48, // 2 days ago
  },
];

// ---------------------------------------------------------------------------
// Consumable usage log (8 entries — various transaction types)
// consumableIndex maps to ALL_SEED_CONSUMABLES positions:
//   0=gloves, 1=ECG electrodes, 2=cidex disinfectant
// usedByKey references userKeyMap
// equipmentIndex: optional — link consumable usage to specific equipment
// ---------------------------------------------------------------------------

interface SeedConsumableUsageLog {
  consumableIndex: number; // Index into consumableIds[] array
  quantity: number;
  transactionType: "RECEIVE" | "USAGE" | "ADJUSTMENT" | "WRITE_OFF" | "EXPIRED";
  usedByKey: "hospital_owner" | "hospital_staff_1" | "hospital_staff_2";
  equipmentIndex?: number; // Optional link to equipment
  notes?: string;
  daysAgo: number;
}

export const SEED_CONSUMABLE_USAGE_LOG: SeedConsumableUsageLog[] = [
  // Gloves — initial receive
  {
    consumableIndex: 0, // Gloves
    quantity: 200,
    transactionType: "RECEIVE",
    usedByKey: "hospital_owner",
    notes:
      "Nhập hàng lần đầu — 200 hộp găng tay cao su y tế cỡ M / Initial stock receipt — 200 boxes of medical rubber gloves size M",
    daysAgo: 90,
  },
  // Gloves — daily usage
  {
    consumableIndex: 0, // Gloves
    quantity: -30,
    transactionType: "USAGE",
    usedByKey: "hospital_staff_1",
    notes:
      "Sử dụng hàng ngày tại các phòng khám / Daily usage across examination rooms",
    daysAgo: 30,
  },
  // Gloves — adjustment (stock count correction)
  {
    consumableIndex: 0, // Gloves
    quantity: -20,
    transactionType: "ADJUSTMENT",
    usedByKey: "hospital_owner",
    notes:
      "Điều chỉnh tồn kho sau kiểm kê — 20 hộp hao hụt không rõ nguyên nhân / Stock adjustment after inventory count — 20 boxes missing without clear reason",
    daysAgo: 14,
  },
  // ECG electrodes — initial receive
  {
    consumableIndex: 1, // ECG electrodes
    quantity: 50,
    transactionType: "RECEIVE",
    usedByKey: "hospital_owner",
    notes:
      "Nhập điện cực ECG dán — 50 hộp cho máy điện tim / ECG adhesive electrode receipt — 50 boxes for ECG machines",
    daysAgo: 60,
  },
  // ECG electrodes — usage with equipment link
  {
    consumableIndex: 1, // ECG electrodes
    quantity: -10,
    transactionType: "USAGE",
    usedByKey: "hospital_staff_1",
    equipmentIndex: 1, // EQUIPMENT_ECG
    notes:
      "Sử dụng điện cực ECG cho máy điện tim GE MAC 5500 HD — 10 hộp / ECG electrode usage for GE MAC 5500 HD ECG machine — 10 boxes",
    daysAgo: 15,
  },
  // ECG electrodes — usage
  {
    consumableIndex: 1, // ECG electrodes
    quantity: -10,
    transactionType: "USAGE",
    usedByKey: "hospital_staff_2",
    equipmentIndex: 1, // EQUIPMENT_ECG
    notes:
      "Sử dụng điện cực ECG cho các ca khám định kỳ / ECG electrode usage for routine examinations",
    daysAgo: 5,
  },
  // Cidex disinfectant — receive
  {
    consumableIndex: 2, // Cidex disinfectant
    quantity: 12,
    transactionType: "RECEIVE",
    usedByKey: "hospital_owner",
    notes:
      "Nhập dung dịch khử trùng Cidex — 12 chai / Cidex disinfectant receipt — 12 bottles",
    daysAgo: 45,
  },
  // Cidex disinfectant — usage with endoscope link
  {
    consumableIndex: 2, // Cidex disinfectant
    quantity: -4,
    transactionType: "USAGE",
    usedByKey: "hospital_staff_2",
    equipmentIndex: 7, // EQUIPMENT_ENDOSCOPE
    notes:
      "Khử trùng máy nội soi sau ca sử dụng — 4 chai Cidex / Post-procedure endoscope disinfection — 4 bottles of Cidex",
    daysAgo: 3,
  },
];

// ---------------------------------------------------------------------------
// Reorder requests (3 — pending, approved, received)
// consumableIndex maps to ALL_SEED_CONSUMABLES positions
// requestedByKey + approvedByKey reference userKeyMap
// ---------------------------------------------------------------------------

interface SeedReorderRequest {
  consumableIndex: number; // Index into consumableIds[] array
  quantity: number;
  status: "pending" | "approved" | "ordered" | "received" | "cancelled";
  requestedByKey: "hospital_owner" | "hospital_staff_1" | "hospital_staff_2";
  approvedByKey:
    | "hospital_owner"
    | "hospital_staff_1"
    | "hospital_staff_2"
    | null;
  notes?: string;
  daysAgo: number;
}

export const SEED_REORDER_REQUESTS: SeedReorderRequest[] = [
  // Received reorder — gloves (completed cycle)
  {
    consumableIndex: 0, // Gloves
    quantity: 100,
    status: "received",
    requestedByKey: "hospital_staff_1",
    approvedByKey: "hospital_owner",
    notes:
      "Tồn kho găng tay đã đạt mức cảnh báo (dưới 50 hộp) — Đặt hàng 100 hộp để đảm bảo hoạt động 30 ngày / Glove stock reached warning level (below 50 boxes) — Ordering 100 boxes to ensure 30-day operation",
    daysAgo: 35,
  },
  // Approved reorder — Cidex disinfectant (stock low at 8 bottles, par level 10)
  {
    consumableIndex: 2, // Cidex disinfectant
    quantity: 20,
    status: "approved",
    requestedByKey: "hospital_staff_2",
    approvedByKey: "hospital_owner",
    notes:
      "Tồn kho Cidex dưới mức tối thiểu (8 chai / par 10 chai) — Đặt hàng 20 chai / Cidex stock below minimum (8 bottles / par 10 bottles) — Ordering 20 bottles",
    daysAgo: 5,
  },
  // Pending reorder — ECG electrodes
  {
    consumableIndex: 1, // ECG electrodes
    quantity: 30,
    status: "pending",
    requestedByKey: "hospital_staff_1",
    approvedByKey: null,
    notes:
      "Điện cực ECG sẽ đạt mức tái đặt hàng (25 hộp) trong tuần tới — Đặt hàng trước 30 hộp / ECG electrodes will reach reorder point (25 boxes) next week — Pre-ordering 30 boxes",
    daysAgo: 1,
  },
];

// ---------------------------------------------------------------------------
// Notifications (5 — across multiple user roles and notification types)
// userKey references: hospital_owner, hospital_staff_1, hospital_staff_2,
//                     provider_owner, admin
// ---------------------------------------------------------------------------

interface SeedNotification {
  userKey:
    | "hospital_owner"
    | "hospital_staff_1"
    | "hospital_staff_2"
    | "provider_owner"
    | "admin";
  type:
    | "service_request_new_quote"
    | "service_request_quote_approved"
    | "service_request_quote_rejected"
    | "service_request_started"
    | "service_request_completed"
    | "equipment_maintenance_due"
    | "equipment_status_broken"
    | "consumable_stock_low"
    | "dispute_new_message"
    | "dispute_resolved";
  titleVi: string;
  titleEn: string;
  bodyVi: string;
  bodyEn: string;
  read: boolean;
  hoursAgo: number;
}

export const SEED_NOTIFICATIONS: SeedNotification[] = [
  // Equipment maintenance due — for hospital_owner
  {
    userKey: "hospital_owner",
    type: "equipment_maintenance_due",
    titleVi: "Bảo trì thiết bị đến hạn",
    titleEn: "Equipment Maintenance Due",
    bodyVi:
      "Máy X-quang (SN-XR-001) đã đến hạn bảo trì định kỳ. Vui lòng lên lịch bảo trì hoặc tạo yêu cầu dịch vụ.",
    bodyEn:
      "X-Ray Machine (SN-XR-001) is due for periodic maintenance. Please schedule maintenance or create a service request.",
    read: false,
    hoursAgo: 24,
  },
  // Consumable stock low — for hospital_staff_1
  {
    userKey: "hospital_staff_1",
    type: "consumable_stock_low",
    titleVi: "Vật tư dưới mức tối thiểu",
    titleEn: "Consumable Stock Low",
    bodyVi:
      "Dung dịch khử trùng Cidex còn 8 chai (dưới mức tối thiểu 10 chai). Vui lòng tạo yêu cầu đặt hàng lại.",
    bodyEn:
      "Cidex Disinfectant Solution has 8 bottles remaining (below minimum level of 10). Please create a reorder request.",
    read: false,
    hoursAgo: 6,
  },
  // Service request completed — for hospital_owner (defibrillator maintenance done)
  {
    userKey: "hospital_owner",
    type: "service_request_completed",
    titleVi: "Dịch vụ đã hoàn thành",
    titleEn: "Service Completed",
    bodyVi:
      "Yêu cầu bảo trì máy sốc điện tim đã được TechMed hoàn thành. Thiết bị đã sẵn sàng sử dụng.",
    bodyEn:
      "Defibrillator maintenance request has been completed by TechMed. Equipment is ready for use.",
    read: true,
    hoursAgo: 168, // 7 days ago
  },
  // Dispute new message — for provider_owner
  {
    userKey: "provider_owner",
    type: "dispute_new_message",
    titleVi: "Tin nhắn tranh chấp mới",
    titleEn: "New Dispute Message",
    bodyVi:
      "Quản trị viên nền tảng đã gửi tin nhắn trong tranh chấp về hóa đơn. Vui lòng xem xét và phản hồi.",
    bodyEn:
      "Platform admin has sent a message in the invoice dispute. Please review and respond.",
    read: false,
    hoursAgo: 72, // 3 days ago
  },
  // Equipment status broken — for hospital_staff_2
  {
    userKey: "hospital_staff_2",
    type: "equipment_status_broken",
    titleVi: "Thiết bị bị hỏng",
    titleEn: "Equipment Broken",
    bodyVi:
      "Máy thở Dräger Evita V800 đã được báo cáo là hỏng. Báo cáo sự cố đã được tạo và đang chờ xử lý.",
    bodyEn:
      "Dräger Evita V800 Ventilator has been reported as damaged. A failure report has been created and is pending review.",
    read: false,
    hoursAgo: 120, // 5 days ago
  },
];
