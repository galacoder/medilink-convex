/**
 * Bilingual labels for the notifications feature module.
 * Vietnamese is primary, English is secondary.
 *
 * vi: "Nhãn song ngữ cho module thông báo" / en: "Bilingual labels for notifications module"
 */
export const notificationLabels = {
  // Page/panel title
  title: { vi: "Thông báo", en: "Notifications" },

  // Actions
  markAllRead: { vi: "Đánh dấu tất cả đã đọc", en: "Mark all as read" },

  // Unread count
  unreadCount: { vi: "thông báo chưa đọc", en: "unread notifications" },

  // Accessibility
  bellAriaLabel: {
    vi: "Mở trung tâm thông báo",
    en: "Open notification center",
  },

  // Empty state
  noNotifications: { vi: "Không có thông báo nào", en: "No notifications yet" },
  noNotificationsDesc: {
    vi: "Các thông báo quan trọng sẽ xuất hiện tại đây",
    en: "Important notifications will appear here",
  },

  // Loading state
  loading: { vi: "Đang tải...", en: "Loading..." },

  // Date group labels
  today: { vi: "Hôm nay", en: "Today" },
  yesterday: { vi: "Hôm qua", en: "Yesterday" },

  // Read/unread accessibility
  unread: { vi: "Thông báo chưa đọc", en: "Unread notification" },
  read: { vi: "Thông báo đã đọc", en: "Read notification" },

  // Notification type labels
  types: {
    service_request_new_quote: { vi: "Báo giá mới", en: "New Quote" },
    service_request_quote_approved: {
      vi: "Báo giá được chấp thuận",
      en: "Quote Approved",
    },
    service_request_quote_rejected: {
      vi: "Báo giá bị từ chối",
      en: "Quote Rejected",
    },
    service_request_started: { vi: "Dịch vụ đã bắt đầu", en: "Service Started" },
    service_request_completed: {
      vi: "Dịch vụ hoàn thành",
      en: "Service Completed",
    },
    equipment_maintenance_due: { vi: "Bảo trì đến hạn", en: "Maintenance Due" },
    equipment_status_broken: { vi: "Thiết bị hỏng", en: "Equipment Broken" },
    consumable_stock_low: { vi: "Vật tư sắp hết", en: "Low Stock" },
    dispute_new_message: { vi: "Tin nhắn tranh chấp", en: "Dispute Message" },
    dispute_resolved: { vi: "Tranh chấp đã giải quyết", en: "Dispute Resolved" },
  },

  // Preferences
  preferences: { vi: "Cài đặt thông báo", en: "Notification settings" },
  preferencesDesc: {
    vi: "Chọn loại thông báo bạn muốn nhận",
    en: "Choose which notifications you want to receive",
  },
  save: { vi: "Lưu cài đặt", en: "Save settings" },
  preferencesUpdated: {
    vi: "Đã lưu cài đặt thông báo",
    en: "Notification settings saved",
  },
} as const;
