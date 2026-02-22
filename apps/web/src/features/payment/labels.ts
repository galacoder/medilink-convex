/**
 * Bilingual labels for the payment feature.
 * Vietnamese is primary, English is secondary.
 *
 * vi: "Nhan song ngu thanh toan" / en: "Payment bilingual labels"
 */
export const paymentLabels = {
  // Page title
  title: { vi: "Thanh toan", en: "Payments" },
  subtitle: {
    vi: "Quan ly thanh toan",
    en: "Payment management",
  },

  // Field labels
  fields: {
    amount: { vi: "So tien", en: "Amount" },
    currency: { vi: "Tien te", en: "Currency" },
    status: { vi: "Trang thai", en: "Status" },
    method: { vi: "Phuong thuc", en: "Method" },
    descriptionVi: { vi: "Mo ta (Tieng Viet)", en: "Description (Vietnamese)" },
    descriptionEn: { vi: "Mo ta (Tieng Anh)", en: "Description (English)" },
    paidBy: { vi: "Nguoi thanh toan", en: "Paid By" },
    paidAt: { vi: "Ngay thanh toan", en: "Paid At" },
    createdAt: { vi: "Ngay tao", en: "Created At" },
  },

  // Status labels
  statuses: {
    pending: { vi: "Cho xu ly", en: "Pending" },
    completed: { vi: "Hoan thanh", en: "Completed" },
    failed: { vi: "That bai", en: "Failed" },
    refunded: { vi: "Hoan tien", en: "Refunded" },
  },

  // Status filter tabs
  filterTabs: {
    all: { vi: "Tat ca", en: "All" },
    pending: { vi: "Cho xu ly", en: "Pending" },
    completed: { vi: "Hoan thanh", en: "Completed" },
    failed: { vi: "That bai", en: "Failed" },
    refunded: { vi: "Hoan tien", en: "Refunded" },
  },

  // Empty states
  empty: {
    noPayments: { vi: "Chua co thanh toan", en: "No payments yet" },
    noPaymentsDesc: {
      vi: "Cac thanh toan se xuat hien o day khi duoc tao",
      en: "Payments will appear here when created",
    },
  },

  // Loading
  loading: { vi: "Dang tai...", en: "Loading..." },

  // Error
  error: { vi: "Co loi xay ra", en: "An error occurred" },

  // Date format label
  date: { vi: "Ngay", en: "Date" },
} as const;
