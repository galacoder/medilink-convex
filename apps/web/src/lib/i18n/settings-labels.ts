/**
 * Bilingual labels for organization settings and member management pages.
 *
 * WHY: Centralized labels follow the same pattern as portal-labels.ts and
 * auth-labels.ts. Vietnamese is primary (displayed by default), English
 * is secondary (used as fallback or in bilingual export reports).
 *
 * All UI strings for settings, members, and invite sections live here.
 */
export const settingsLabels = {
  // ---------------------------------------------------------------------------
  // Organization Settings
  // ---------------------------------------------------------------------------
  settings: {
    title: { vi: "Cài đặt tổ chức", en: "Organization Settings" },
    subtitle: {
      vi: "Quản lý thông tin và cài đặt tổ chức của bạn",
      en: "Manage your organization information and settings",
    },
    breadcrumb: { vi: "Cài đặt", en: "Settings" },
    form: {
      name: { vi: "Tên tổ chức", en: "Organization Name" },
      namePlaceholder: { vi: "Nhập tên tổ chức", en: "Enter organization name" },
      slug: { vi: "Slug (đường dẫn)", en: "Slug (URL path)" },
      slugPlaceholder: { vi: "ten-to-chuc", en: "organization-name" },
      slugHint: {
        vi: "Chỉ được dùng chữ thường, số và dấu gạch ngang",
        en: "Only lowercase letters, numbers, and hyphens",
      },
      contactEmail: { vi: "Email liên hệ", en: "Contact Email" },
      contactEmailPlaceholder: { vi: "email@to-chuc.vn", en: "email@organization.com" },
      contactPhone: { vi: "Số điện thoại", en: "Phone Number" },
      contactPhonePlaceholder: { vi: "0901234567", en: "0901234567" },
      address: { vi: "Địa chỉ", en: "Address" },
      addressPlaceholder: {
        vi: "Số nhà, đường, phường, quận, thành phố",
        en: "Street address, district, city",
      },
      submit: { vi: "Lưu thay đổi", en: "Save Changes" },
      submitting: { vi: "Đang lưu...", en: "Saving..." },
    },
    success: {
      vi: "Cài đặt tổ chức đã được cập nhật",
      en: "Organization settings updated successfully",
    },
    error: {
      vi: "Không thể cập nhật cài đặt tổ chức",
      en: "Failed to update organization settings",
    },
  },

  // ---------------------------------------------------------------------------
  // Members Management
  // ---------------------------------------------------------------------------
  members: {
    title: { vi: "Thành viên", en: "Members" },
    subtitle: {
      vi: "Quản lý thành viên và phân quyền trong tổ chức",
      en: "Manage organization members and their permissions",
    },
    breadcrumb: { vi: "Thành viên", en: "Members" },
    table: {
      name: { vi: "Tên", en: "Name" },
      email: { vi: "Email", en: "Email" },
      role: { vi: "Vai trò", en: "Role" },
      joinedAt: { vi: "Ngày tham gia", en: "Joined" },
      actions: { vi: "Thao tác", en: "Actions" },
    },
    roles: {
      owner: { vi: "Chủ sở hữu", en: "Owner" },
      admin: { vi: "Quản trị viên", en: "Admin" },
      member: { vi: "Thành viên", en: "Member" },
    },
    actions: {
      changeRole: { vi: "Đổi vai trò", en: "Change Role" },
      remove: { vi: "Xóa", en: "Remove" },
      removeConfirmTitle: { vi: "Xóa thành viên", en: "Remove Member" },
      removeConfirmDesc: {
        vi: "Bạn có chắc chắn muốn xóa thành viên này khỏi tổ chức? Hành động này không thể hoàn tác.",
        en: "Are you sure you want to remove this member from the organization? This action cannot be undone.",
      },
      removeConfirm: { vi: "Xóa thành viên", en: "Remove Member" },
      removeCancel: { vi: "Hủy", en: "Cancel" },
      removingMember: { vi: "Đang xóa...", en: "Removing..." },
    },
    empty: {
      vi: "Chưa có thành viên nào. Mời thành viên đầu tiên bên dưới.",
      en: "No members yet. Invite the first member below.",
    },
    tooltips: {
      lastOwner: {
        vi: "Không thể xóa chủ sở hữu cuối cùng",
        en: "Cannot remove the last owner",
      },
      cannotManage: {
        vi: "Bạn không có quyền thực hiện hành động này",
        en: "You don't have permission to perform this action",
      },
    },
    success: {
      roleChanged: {
        vi: "Vai trò thành viên đã được cập nhật",
        en: "Member role updated successfully",
      },
      removed: {
        vi: "Thành viên đã được xóa khỏi tổ chức",
        en: "Member removed from organization",
      },
    },
    error: {
      roleChange: {
        vi: "Không thể thay đổi vai trò thành viên",
        en: "Failed to change member role",
      },
      remove: {
        vi: "Không thể xóa thành viên",
        en: "Failed to remove member",
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Invite Member
  // ---------------------------------------------------------------------------
  invite: {
    title: { vi: "Mời thành viên", en: "Invite Member" },
    subtitle: {
      vi: "Gửi lời mời qua email để thêm thành viên mới vào tổ chức",
      en: "Send an email invitation to add a new member to the organization",
    },
    form: {
      email: { vi: "Địa chỉ email", en: "Email Address" },
      emailPlaceholder: { vi: "email@example.com", en: "email@example.com" },
      role: { vi: "Vai trò", en: "Role" },
      roleOptions: {
        admin: { vi: "Quản trị viên", en: "Admin" },
        member: { vi: "Thành viên", en: "Member" },
      },
      submit: { vi: "Gửi lời mời", en: "Send Invitation" },
      submitting: { vi: "Đang gửi...", en: "Sending..." },
    },
    pending: {
      title: { vi: "Lời mời đang chờ", en: "Pending Invitations" },
      empty: { vi: "Không có lời mời đang chờ", en: "No pending invitations" },
      resend: { vi: "Gửi lại", en: "Resend" },
      revoke: { vi: "Thu hồi", en: "Revoke" },
      revoking: { vi: "Đang thu hồi...", en: "Revoking..." },
      statuses: {
        pending: { vi: "Đang chờ", en: "Pending" },
        accepted: { vi: "Đã chấp nhận", en: "Accepted" },
        expired: { vi: "Đã hết hạn", en: "Expired" },
        rejected: { vi: "Đã từ chối", en: "Rejected" },
      },
    },
    success: {
      vi: "Đã gửi lời mời thành công",
      en: "Invitation sent successfully",
    },
    error: {
      vi: "Không thể gửi lời mời. Vui lòng thử lại.",
      en: "Failed to send invitation. Please try again.",
    },
    revokeSuccess: {
      vi: "Đã thu hồi lời mời",
      en: "Invitation revoked",
    },
    revokeError: {
      vi: "Không thể thu hồi lời mời",
      en: "Failed to revoke invitation",
    },
  },

  // ---------------------------------------------------------------------------
  // Common
  // ---------------------------------------------------------------------------
  common: {
    loading: { vi: "Đang tải...", en: "Loading..." },
    save: { vi: "Lưu", en: "Save" },
    cancel: { vi: "Hủy", en: "Cancel" },
    confirm: { vi: "Xác nhận", en: "Confirm" },
    noData: { vi: "Không có dữ liệu", en: "No data available" },
  },
} as const;

export type SettingsLabels = typeof settingsLabels;
