/**
 * Bilingual labels for the support feature.
 * Vietnamese is primary, English is secondary.
 *
 * vi: "Nhan song ngu ho tro" / en: "Support bilingual labels"
 */
export const supportLabels = {
  // Page title
  title: { vi: "Ho tro", en: "Support" },
  subtitle: {
    vi: "Quan ly yeu cau ho tro",
    en: "Support ticket management",
  },

  // Ticket creation
  newTicket: { vi: "Tao yeu cau ho tro", en: "New Support Ticket" },
  subject: { vi: "Tieu de", en: "Subject" },
  description: { vi: "Mo ta", en: "Description" },

  // Field labels
  fields: {
    subject: { vi: "Tieu de", en: "Subject" },
    subjectVi: { vi: "Tieu de (Tieng Viet)", en: "Subject (Vietnamese)" },
    subjectEn: { vi: "Tieu de (Tieng Anh)", en: "Subject (English)" },
    descriptionVi: {
      vi: "Mo ta (Tieng Viet)",
      en: "Description (Vietnamese)",
    },
    descriptionEn: {
      vi: "Mo ta (Tieng Anh)",
      en: "Description (English)",
    },
    category: { vi: "Danh muc", en: "Category" },
    priority: { vi: "Muc do uu tien", en: "Priority" },
    status: { vi: "Trang thai", en: "Status" },
    createdAt: { vi: "Ngay tao", en: "Created At" },
    updatedAt: { vi: "Cap nhat lan cuoi", en: "Last Updated" },
    createdBy: { vi: "Nguoi tao", en: "Created By" },
    assignedTo: { vi: "Nguoi phu trach", en: "Assigned To" },
  },

  // Status labels
  statuses: {
    open: { vi: "Mo", en: "Open" },
    in_progress: { vi: "Dang xu ly", en: "In Progress" },
    resolved: { vi: "Da giai quyet", en: "Resolved" },
    closed: { vi: "Da dong", en: "Closed" },
  },

  // Priority labels
  priorities: {
    low: { vi: "Thap", en: "Low" },
    medium: { vi: "Trung binh", en: "Medium" },
    high: { vi: "Cao", en: "High" },
    critical: { vi: "Khan cap", en: "Critical" },
  },

  // Category labels
  categories: {
    general: { vi: "Chung", en: "General" },
    technical: { vi: "Ky thuat", en: "Technical" },
    billing: { vi: "Thanh toan", en: "Billing" },
    feature_request: { vi: "Yeu cau tinh nang", en: "Feature Request" },
    other: { vi: "Khac", en: "Other" },
  },

  // Status filter tabs
  filterTabs: {
    all: { vi: "Tat ca", en: "All" },
    open: { vi: "Mo", en: "Open" },
    in_progress: { vi: "Dang xu ly", en: "In Progress" },
    resolved: { vi: "Da giai quyet", en: "Resolved" },
    closed: { vi: "Da dong", en: "Closed" },
  },

  // Actions
  actions: {
    create: { vi: "Tao phieu ho tro", en: "Create Ticket" },
    submit: { vi: "Gui", en: "Submit" },
    cancel: { vi: "Huy", en: "Cancel" },
    resolve: { vi: "Giai quyet", en: "Resolve" },
    close: { vi: "Dong", en: "Close" },
    assign: { vi: "Phan cong", en: "Assign" },
    sendMessage: { vi: "Gui tin nhan", en: "Send Message" },
    addReply: { vi: "Them phan hoi", en: "Add Reply" },
    viewDetail: { vi: "Xem chi tiet", en: "View Detail" },
  },

  // Empty states
  empty: {
    noTickets: { vi: "Chua co yeu cau ho tro", en: "No support tickets yet" },
    noTicketsDesc: {
      vi: "Tao yeu cau ho tro khi ban can tro giup",
      en: "Create a support ticket when you need help",
    },
    noMessages: { vi: "Chua co tin nhan nao", en: "No messages yet" },
    noMessagesDesc: {
      vi: "Bat dau cuoc tro chuyen bang cach gui tin nhan dau tien",
      en: "Start the conversation by sending the first message",
    },
  },

  // Placeholders
  placeholders: {
    subjectVi: {
      vi: "Nhap tieu de phieu ho tro...",
      en: "Enter support ticket subject...",
    },
    subjectEn: {
      vi: "Tieu de bang tieng Anh (khong bat buoc)...",
      en: "Subject in English (optional)...",
    },
    descriptionVi: {
      vi: "Mo ta chi tiet van de...",
      en: "Describe the issue in detail...",
    },
    descriptionEn: {
      vi: "Mo ta bang tieng Anh (khong bat buoc)...",
      en: "Description in English (optional)...",
    },
    messageVi: {
      vi: "Nhap phan hoi...",
      en: "Type your reply...",
    },
    selectCategory: {
      vi: "Chon danh muc",
      en: "Select category",
    },
    selectPriority: {
      vi: "Chon muc do uu tien",
      en: "Select priority",
    },
  },

  // Form section titles
  form: {
    title: { vi: "Tao phieu ho tro moi", en: "Create New Support Ticket" },
    categoryLabel: { vi: "Danh muc", en: "Category" },
    priorityLabel: { vi: "Muc do uu tien", en: "Priority" },
  },

  // Loading states
  loading: { vi: "Dang tai...", en: "Loading..." },

  // Success/Error messages
  createSuccess: {
    vi: "Tao phieu ho tro thanh cong",
    en: "Support ticket created successfully",
  },
  error: { vi: "Co loi xay ra", en: "An error occurred" },

  // Breadcrumb
  backToList: { vi: "Danh sach phieu ho tro", en: "Support Tickets" },

  // Message thread
  thread: {
    title: { vi: "Cuoc tro chuyen", en: "Message Thread" },
  },

  // Detail page sections
  detail: {
    ticketInfo: { vi: "Thong tin phieu ho tro", en: "Ticket Information" },
    statusInfo: { vi: "Trang thai & Tien trinh", en: "Status & Progress" },
  },

  // Admin labels
  admin: {
    title: { vi: "Quan ly phieu ho tro", en: "Support Ticket Management" },
    subtitle: {
      vi: "Quan ly tat ca phieu ho tro tren nen tang",
      en: "Manage all support tickets across the platform",
    },
    organization: { vi: "To chuc", en: "Organization" },
    assignee: { vi: "Nguoi phu trach", en: "Assignee" },
    unassigned: { vi: "Chua phan cong", en: "Unassigned" },
    selectAdmin: { vi: "Chon quan tri vien", en: "Select administrator" },
  },
} as const;
