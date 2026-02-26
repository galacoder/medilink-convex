/**
 * Bilingual labels for the ai-assistant feature module.
 * Vietnamese is primary, English is secondary.
 *
 * vi: "Nhãn song ngữ cho module trợ lý AI" / en: "Bilingual labels for ai-assistant module"
 */
export const aiAssistantLabels = {
  // Floating button
  floatingButton: { vi: "Trợ lý AI", en: "AI Assistant" },

  // Portal-specific titles
  hospitalTitle: {
    vi: "Trợ lý thiết bị y tế",
    en: "Medical Equipment Assistant",
  },
  providerTitle: { vi: "Trợ lý nhà cung cấp", en: "Provider Assistant" },

  // Placeholder texts for sidebar input
  hospitalPlaceholder: {
    vi: "Hỏi về thiết bị, yêu cầu dịch vụ... (Ask about equipment, service requests...)",
    en: "Ask about equipment, service requests...",
  },
  providerPlaceholder: {
    vi: "Hỏi về báo giá, dịch vụ... (Ask about quotes, services...)",
    en: "Ask about quotes, services...",
  },

  // Initial messages (portal-specific)
  hospitalInitial: {
    vi: 'Xin chào! Tôi có thể giúp bạn:\n• Tìm thiết bị y tế ("Tìm tất cả máy X-quang hỏng")\n• Soạn yêu cầu dịch vụ ("Tạo yêu cầu bảo trì cho máy siêu âm Phòng 3")\n• Trả lời câu hỏi phân tích ("Có bao nhiêu yêu cầu dịch vụ tháng này?")',
    en: 'Hello! I can help you:\n• Find medical equipment ("Find all broken X-ray machines")\n• Draft service requests ("Create a maintenance request for ultrasound in Room 3")\n• Answer analytics questions ("How many service requests this month?")',
  },
  providerInitial: {
    vi: 'Xin chào! Tôi có thể giúp bạn:\n• Hỏi về báo giá ("Tôi có bao nhiêu báo giá đang chờ?")\n• Quản lý dịch vụ ("Dịch vụ nào đang được yêu cầu nhiều nhất?")',
    en: 'Hello! I can help you:\n• Ask about quotes ("How many pending quotes do I have?")\n• Manage services ("Which services are most requested?")',
  },

  // Chat history
  noHistory: { vi: "Chưa có lịch sử trò chuyện", en: "No chat history yet" },
  noHistoryDesc: {
    vi: "Các cuộc trò chuyện với trợ lý AI sẽ được lưu tại đây",
    en: "Your AI assistant conversations will be saved here",
  },
  historyTitle: { vi: "Lịch sử trò chuyện", en: "Chat History" },

  // Loading / error states
  loading: { vi: "Đang tải...", en: "Loading..." },
  error: { vi: "Có lỗi xảy ra", en: "An error occurred" },

  // Close button
  close: { vi: "Đóng", en: "Close" },

  // Page-level labels
  pageTitle: { vi: "Trợ lý AI", en: "AI Assistant" },
  pageSubtitle: {
    vi: "Hỏi về thiết bị, dịch vụ và phân tích",
    en: "Ask about equipment, services and analytics",
  },

  // Conversation list sidebar
  conversations: { vi: "Hội thoại", en: "Conversations" },
  newConversation: {
    vi: "Hội thoại mới",
    en: "New Conversation",
  },
  deleteConversation: { vi: "Xóa hội thoại", en: "Delete Conversation" },
  deleteConfirm: {
    vi: "Bạn có chắc chắn muốn xóa hội thoại này?",
    en: "Are you sure you want to delete this conversation?",
  },
  cancel: { vi: "Hủy", en: "Cancel" },
  confirm: { vi: "Xác nhận", en: "Confirm" },

  // Chat input
  sendMessage: { vi: "Gửi", en: "Send" },
  inputPlaceholder: {
    vi: "Nhập tin nhắn...",
    en: "Type a message...",
  },

  // Roles
  roleUser: { vi: "Bạn", en: "You" },
  roleAssistant: { vi: "Trợ lý AI", en: "AI Assistant" },

  // Empty state
  selectOrCreate: {
    vi: "Chọn hội thoại hoặc tạo mới để bắt đầu",
    en: "Select a conversation or create a new one to start",
  },

  // Stub response
  stubResponse: {
    vi: "Tích hợp AI đang được phát triển. Tính năng này sẽ sớm được kết nối với mô hình AI.",
    en: "AI integration is under development. This feature will soon be connected to an AI model.",
  },
} as const;
